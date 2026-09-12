# Fitur Kategori — Dokumentasi Project Vue Finance

Dokumen ini menjelaskan fitur kelola kategori pada project ini (`vue-finance`).

## Ringkasan

| Halaman | Route | Komponen | Fungsi |
|---------|-------|----------|--------|
| Categories | `/categories` | `CategoriesPage.vue` → `CategoryManager.vue` | List, tambah, edit, hapus kategori |

Kategori juga dipakai read-only sebagai dropdown di halaman transaksi (lihat `docs/feature/transaction/README.md`).

## Arsitektur & Alur Data

Sumber data: **Backend REST (BE)** via `VITE_API_BASE_URL`. Endpoint sesuai `docs/be/categories.md`.

```
┌─────────────┐   GET    /categories        ┌──────────────────────────┐
│   Frontend  │ ──────────────────────────► │ Backend REST             │
│   (Vue 3)   │   POST   /categories        │  (kategori, CRUD)        │
│             │ ──────────────────────────► │                          │
│             │   PUT    /categories/:id    │                          │
│             │ ──────────────────────────► │                          │
│             │   DELETE /categories/:id    │                          │
│             │ ──────────────────────────► │                          │
└─────────────┘                             └──────────────────────────┘
```

## Endpoint yang Digunakan

| Method | Endpoint | Dipakai oleh | Fungsi |
|--------|----------|--------------|--------|
| GET | `/categories` | `CategoryManager.vue`, `TransactionForm.vue`, `AllTransaction.vue` | Ambil semua kategori |
| POST | `/categories` | `CategoryManager.vue` | Tambah kategori |
| PUT | `/categories/:id` | `CategoryManager.vue` | Perbarui kategori |
| DELETE | `/categories/:id` | `CategoryManager.vue` | Hapus kategori |

Kontrak lengkap & aturan bisnis ada di `docs/be/categories.md`.

## Alur UI

- **List** — `GET /categories` saat halaman dibuka, ditampilkan dalam tabel (`ID`, `Name`, `Actions`).
- **Tambah** — tombol **Add Category** membuka modal, submit `POST /categories` body `{ "name": "..." }`.
- **Edit** — ikon pensil membuka modal terisi, submit `PUT /categories/:id` body `{ "name": "..." }`.
- **Hapus** — ikon tempat sampah dengan konfirmasi, lalu `DELETE /categories/:id`.

## Validasi & Error Handling

| Aspek | Penanganan di Frontend |
|-------|------------------------|
| `name` kosong | Dicek sebelum kirim → `alert("Name is required")` |
| `name` terlalu panjang | `maxlength="100"` pada input (mengikuti batas BE) |
| Sukses | `alert` konfirmasi ("Category successfully saved/updated/deleted") |
| Error server | `alert(err.response?.data?.error?.message)` dengan fallback generik |

Skenario error dari BE yang perlu diperhatikan:

- `409 Conflict` — nama duplikat (case-insensitive) saat create/update.
- `409 Conflict` — kategori masih dipakai transaksi saat delete; BE mengirim pesan `"Cannot delete category that is used by transactions"`.
- `400 Bad Request` — validasi `name` gagal.
- `404 Not Found` — kategori tidak ditemukan saat update/delete.

## Cache Lokal

Setiap kali daftar kategori berhasil di-fetch/diubah, `CategoryManager.vue` menulis `localStorage.categoriesData`. Cache ini juga dipakai oleh `TransactionForm.vue` & `AllTransaction.vue`.
