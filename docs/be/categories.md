# Kategori — Petunjuk Endpoint untuk Tim Frontend

## Endpoint

| Method | Path | Keterangan | Sukses | Error |
|--------|------|-----------|--------|-------|
| GET | `/categories` | List semua kategori | 200 | 500 |
| GET | `/categories/:id` | Detail satu kategori | 200 | 404 |
| POST | `/categories` | Buat kategori baru | 201 | 400, 409 |
| PUT | `/categories/:id` | Perbarui kategori | 200 | 400, 404, 409 |
| DELETE | `/categories/:id` | Hapus kategori | 204 | 404, 409 |

## Payload

**Request body (POST / PUT):**
```json
{ "name": "Makanan" }
```

**Response:**
- `GET /categories` → 200
  ```json
  [
    { "id": 1, "name": "Makanan" },
    { "id": 2, "name": "Transport" }
  ]
  ```
- `GET /categories/:id` → 200, `{ "id": 1, "name": "Makanan" }`
- `POST /categories` → 201, `{ "id": 3, "name": "Kopi" }`
- `PUT /categories/:id` → 200, `{ "id": 1, "name": "Makanan Baru" }`
- `DELETE /categories/:id` → 204 (tanpa body)

## Validasi Field `name`

| Aturan | Keterangan |
|--------|-----------|
| Wajib | Harus ada di request body |
| String non-empty | Nama di-trim, tidak boleh kosong |
| Maksimal | 100 karakter |
| Unik case-insensitive | `"Makanan"` dan `"makanan"` dianggap sama |

Jika dilanggar → `400 Bad Request`.

## Aturan Bisnis

1. **Nama unik case-insensitive** — nama duplikat (bedanya hanya huruf besar/kecil) → `409 Conflict`.
2. **Tidak bisa hapus kategori yang masih dipakai transaksi** → `409 Conflict` dengan pesan:
   `"Cannot delete category that is used by transactions"`.
3. **Update nama yang sama dengan nilai lama** → diperbolehkan (bukan error).

## Error Codes

| Status | Berita |
|--------|--------|
| 400 | Validasi gagal (name kosong/terlalu panjang) |
| 404 | Kategori tidak ditemukan |
| 409 | Nama duplikat / kategori masih dipakai transaksi |
| 500 | Kesalahan server |

## Catatan Penting untuk Frontend

- `category_id` **wajib** pada setiap transaksi dan harus merujuk ke kategori yang valid.
- Setiap transaksi menampilkan data kategori, pastikan list kategori dimuat (mis. saat form transaksi) agar `category_id` selalu valid.
- Kategori yang masih dipakai transaksi tidak bisa dihapus — tampilkan pesan `409` dari server kepada user.