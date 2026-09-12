# Fitur Transaksi — Dokumentasi Project Vue Finance

Dokumen ini menjelaskan cara kerja fitur transaksi pada project ini (`vue-finance`).

> **Catatan:** Kategori **dan** transaksi sekarang sama-sama diambil dari **Backend REST (BE)**. Endpoint `GET /categories` sesuai `docs/be/categories.md`; endpoint transaksi (`GET`/`POST /transactions`) kontraknya disusun dari perilaku penggunaan pada frontend.

## Ringkasan

| Halaman | Route | Komponen | Fungsi |
|---------|-------|----------|--------|
| Transactions | `/transactions` | `TransactionsPage.vue` → `TransactionForm.vue` | Input transaksi baru |
| All Transactions | `/all-transactions` | `AllTransaction.vue` → `components/AllTransaction.vue` | List, filter, detail transaksi |
| Dashboard | `/` | `DashboardPage.vue` → `components/Dashboard.vue` | Ringkasan, transaksi terbaru, chart |

## Arsitektur & Alur Data

Project ini memakai **satu sumber data**: **Backend REST (BE)**.

```
┌─────────────┐   GET /categories      ┌──────────────────────────┐
│   Frontend  │ ─────────────────────► │ Backend REST             │
│   (Vue 3)   │   GET /transactions    │  - kategori              │
│             │ ─────────────────────► │  - transaksi             │
│             │   POST /transactions   │                          │
│             │ ─────────────────────► │                          │
└─────────────┘                        └──────────────────────────┘
```

Seluruh request memakai `VITE_API_BASE_URL` sebagai base URL.

## Konfigurasi Environment

| Variabel | Nilai | Peran |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://finance-bot.katmanfatahoni.workers.dev` | URL base **Backend REST** (Cloudflare Workers) untuk kategori & transaksi |

Contoh isi TERSEDIA di **`.env.example`**.

> **Catatan:** `VITE_SHEETDB_API` dan `VITE_SHEETDB_POST_API` masih ada di `.env.example` tetapi **tidak lagi dipakai** oleh kode — dukungan Google Sheets dihapus seiring migrasi (lihat [Fase Migrasi](#fase-migrasi)).

## Skema Data

### Kategori (dari Backend REST)

| Kolom | Tipe | Contoh |
|-------|------|--------|
| `id` | angka | `1` |
| `name` | string | `"Makanan"` |

Response `GET /categories`: `[{ "id": 1, "name": "Makanan" }, ...]` — sesuai kontrak `docs/be/categories.md`.

### Transaksi (dari Backend REST)

| Kolom | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `date` | string (ISO) | `2026-09-06` | Format `YYYY-MM-DD` |
| `type` | string | `income` / `outcome` | Huruf kecil |
| `nominal` | angka | `1500000` | Dikirim sebagai number |
| `category_id` | angka | `1` | Dikirim saat create, merujuk `id` kategori |
| `category_name` | string | `"Makanan"` | Dikembalikan BE saat read |
| `description` | string / null | `"Belanja bulanan"` | Opsional, boleh kosong |

## Endpoint yang Digunakan

| Layanan | Method | Endpoint | Dipakai oleh | Fungsi |
|---------|--------|----------|--------------|--------|
| Backend REST | GET | `/categories` | `TransactionForm.vue`, `AllTransaction.vue` | Ambil semua kategori |
| Backend REST | GET | `/transactions` | `Dashboard.vue`, `AllTransaction.vue` | Ambil semua transaksi |
| Backend REST | POST | `/transactions` | `TransactionForm.vue` | Simpan transaksi baru |

## Kontrak Payload

**GET `/categories` → 200 (response):**
```json
[
  { "id": 1, "name": "Makanan" },
  { "id": 2, "name": "Transport" }
]
```

**POST `/transactions` (body):**
```json
{
  "date": "2026-09-06",
  "type": "outcome",
  "category_id": 1,
  "nominal": 1500000,
  "description": "Belanja bulanan"
}
```

**GET `/transactions` → 200 (response):**
```json
[
  {
    "date": "2026-09-06",
    "type": "outcome",
    "nominal": 1500000,
    "category_id": 1,
    "category_name": "Makanan",
    "description": "Belanja bulanan"
  }
]
```

## Transformasi Format di Frontend

| Data | Penanganan |
|------|-----------|
| `nominal` saat input | Karakter non-digit dibuang (`formatNominal`); angka disimpan tanpa separator, mis. `1.000.000` → dikirim `1000000` sebagai number |
| Tampilan nominal | `Number(value).toLocaleString("id-ID")` → `1.000.000` |
| Tanggal input | `<input type="date">` → nilai `YYYY-MM-DD` |
| Tampilan tanggal | `2026-09-06` → `06/09/2026` |
| Kategori pada transaksi | Dikirim sebagai **`category_id`** (nilai `<option>` = `item.id`); daftar kategori dari `GET /categories`. Saat read, ditampilkan lewat `category_name` |

## Keterbatasan & Catatan

- **Kode BE tidak ada di repo** — kontrak endpoint transaksi disusun dari perilaku penggunaan pada frontend.
- **Tidak ada edit/hapus transaksi** — hanya create + read.
- Kategori dipakai read-only untuk dropdown pada halaman transaksi; CRUD kategori tersedia di halaman `/categories` (lihat `docs/feature/category/README.md`).

## Fase Migrasi

| Fase | Status | Keterangan |
|------|--------|------------|
| 1. Kategori → BE REST | ✅ Selesai | `getCategory()` di `TransactionForm.vue` & `AllTransaction.vue` memakai `GET /categories` |
| 2. Transaksi → BE REST | ✅ Selesai | `GET`/`POST /transactions` di `Dashboard.vue`, `AllTransaction.vue`, & `TransactionForm.vue` memakai BE REST (SheetDB/Apps Script tidak lagi dipakai) |
