# Fitur Transaksi — Dokumentasi Project Vue Finance

Dokumen ini menjelaskan cara kerja fitur transaksi pada project ini (`vue-finance`) dari sisi frontend dan backend eksternal yang dipakai.

> **Catatan:** `docs/be/categories.md` berasal dari project backend (BE) yang kini benar-benar dipakai untuk data kategori — endpoint `GET /categories` implementasinya sesuai dokumen itu. Data transaksi masih memakai Google Sheets (lihat [Fase Migrasi](#fase-migrasi)).

## Ringkasan

| Halaman | Route | Komponen | Fungsi |
|---------|-------|----------|--------|
| Transactions | `/transactions` | `TransactionsPage.vue` → `TransactionForm.vue` | Input transaksi baru |
| All Transactions | `/all-transactions` | `AllTransaction.vue` → `components/AllTransaction.vue` | List, filter, detail transaksi |
| Dashboard | `/` | `DashboardPage.vue` → `components/Dashboard.vue` | Ringkasan, transaksi terbaru, chart |

## Arsitektur & Alur Data

Project ini memakai **dua sumber data**:

- **Backend REST (BE)** — untuk data **kategori** (URL `ngrok-free.app`, `GET /categories`).
- **Google Sheets** — untuk data **transaksi**, via Google Apps Script (baca) dan SheetDB.io (tulis).

```
┌─────────────┐   GET /categories                           ┌──────────────────────┐
│   Frontend  │ ──────────────────────────────────────────► │ Backend REST (BE)     │
│   (Vue 3)   │                                             │  (kategori, read-only) │
│             │                                             └──────────────────────┘
│             │   GET ?sheet=transactions                   ┌──────────────────────┐
│             │ ──────────────────────────────────────────► │ Google Apps Script    │
│             │                                             │  (read-only)          │
│             │   POST ?sheet=transactions { data: [...] }  └──────────────────────┘
│             │ ──────────────────────────────────────────► │ SheetDB.io            │
└─────────────┘                                             │  (write)              │
                                                           └──────────┬───────────┘
                                                                      ▼
                                                           ┌──────────────────────┐
                                                           │ Google Sheet          │
                                                           │  - transactions       │
                                                           └──────────────────────┘
```

## Konfigurasi Environment

| Variabel | Nilai | Peran |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://2d06-103-76-107-26.ngrok-free.app` | URL base **Backend REST** untuk baca kategori (`GET /categories`) |
| `VITE_SHEETDB_API` | `https://script.google.com/macros/s/xxxxxx` | URL base Google Apps Script untuk **baca** transaksi (GET) |
| `VITE_SHEETDB_POST_API` | `https://sheetdb.io/api/v1/xxxxx` | URL base SheetDB.io untuk **tulis** transaksi (POST) |

Contoh isi TERSEDIA di **`.env.example`** — salin ke `.env` dan sesuaikan nilai aslinya. Variabel dibaca via `import.meta.env.VITE_*`.

> **Penting:** URL ngrok bersifat sementara (free tier) dan bisa berubah setiap tunnel dijalankan ulang. Perbarui `VITE_API_BASE_URL` di `.env` saat tunnel berganti.

## Skema Data

### Kategori (dari Backend REST)

| Kolom | Tipe | Contoh |
|-------|------|--------|
| `id` | angka | `1` |
| `name` | string | `"Makanan"` |

Response `GET /categories`: `[{ "id": 1, "name": "Makanan" }, ...]` — sesuai kontrak `docs/be/categories.md`.

### Transaksi (dari Google Sheet `transactions`)

| Kolom | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `date` | string (ISO) | `2026-09-06` | Format `YYYY-MM-DD` |
| `type` | string | `Income` / `Outcome` | Enum 2 nilai |
| `nominal` | string angka | `"1500000"` | Disimpan tanpa separator `.` |
| `category` | string | `"Makanan"` | **Nama** kategori (bukan id) |
| `description` | string | `"Belanja bulanan"` | Opsional, boleh kosong |

## Endpoint yang Digunakan

| Layanan | Method | Endpoint | Dipakai oleh | Fungsi |
|---------|--------|----------|--------------|--------|
| Backend REST | GET | `/categories` | `TransactionForm.vue`, `AllTransaction.vue` | Ambil semua kategori |
| Apps Script | GET | `?sheet=transactions` | `Dashboard.vue`, `AllTransaction.vue` | Ambil semua transaksi |
| SheetDB.io | POST | `?sheet=transactions` | `TransactionForm.vue` | Simpan transaksi baru |

## Kontrak Payload

**GET `/categories` → 200 (response:**
```json
[
  { "id": 1, "name": "Makanan" },
  { "id": 2, "name": "Transport" }
]
```

**POST `?sheet=transactions` (body:**
```json
{
  "data": [
    {
      "date": "2026-09-06",
      "type": "Outcome",
      "nominal": "1500000",
      "category": "Makanan",
      "description": "Belanja bulanan"
    }
  ]
}
```

**GET `?sheet=transactions` → 200 (response:**
```json
[
  {
    "date": "2026-09-06",
    "type": "Outcome",
    "nominal": "1500000",
    "category": "Makanan",
    "description": "Belanja bulanan"
  }
]
```

## Transformasi Format di Frontend

| Data | Penanganan |
|------|-----------|
| `nominal` saat input | Karakter non-digit dibuang (`formatNominal`); angka disimpan tanpa separator, mis. `1.000.000` → dikirim `"1000000"` |
| Tampilan nominal | `Number(value).toLocaleString("id-ID")` → `1.000.000` |
| Tanggal input | `<input type="date">` → nilai `YYYY-MM-DD` |
| Tampilan tanggal | `2026-09-06` → `06/09/2026` |
| Kategori pada transaksi | Disimpan sebagai **nama string** (nilai `<option>` = `item.name`) — sumber daftar kategori dari BE REST |

## Perbedaan dengan `docs/be/categories.md`

| Aspek | Project ini | `docs/be/categories.md` |
|-------|-------------|--------------------------|
| Backend | Kategori: BE REST (ngrok); transaksi: Google Sheets | REST API khusus kategori |
| Relasi kategori | Transaksi menyimpan nama (`category`) | Mewajibkan `category_id` |
| CRUD kategori | Dipakai read-only (belum ada UI kelola) | GET/POST/PUT/DELETE lengkap |
| Validasi | Frontend (`alert`) | Backend (400/404/409) |
| Error handling | `alert("Failed to save data")` | Kode status HTTP 4xx/5xx |

## Keterbatasan & Catatan

- **Kode Apps Script & kode BE tidak ada di repo** — kontrak disusun dari perilaku penggunaan pada frontend.
- **Validasi data transaksi terjadi di sisi frontend**, backend tidak memvalidasi.
- **Tidak ada edit/hapus transaksi** — hanya create + read.
- Kategori dipakai read-only untuk dropdown; UI kelola kategori (POST/PUT/DELETE `/categories`) belum dibuat.

## Fase Migrasi

| Fase | Status | Keterangan |
|------|--------|------------|
| 1. Kategori → BE REST | ✅ Selesai | `getCategory()` di `TransactionForm.vue` & `AllTransaction.vue` kini `GET /categories` |
| 2. Transaksi → BE REST | ⏳ Berikutnya | Pindahkan POST/GET transaksi dari SheetDB/Apps Script ke endpoint transaksi BE |