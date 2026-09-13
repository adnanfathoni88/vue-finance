# Categories

Modul kategori memungkinkan pengelompokan transaksi keuangan (mis. Makanan, Transport,
Gaji). Setiap transaksi wajib memiliki `category_id` yang merujuk ke tabel `categories`.

Setiap kategori juga memiliki `type` (`income` atau `outcome`) yang menentukan jenis
transaksi yang boleh memakainya. Kategori `"Makanan"` bertipe `outcome`, kategori
`"Gaji"` bertipe `income`.

## Database Schema

**Tabel `categories`**

```sql
CREATE TABLE categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'outcome' CHECK (type IN ('income', 'outcome'))
);
```

**Unique index (case-insensitive)**

```sql
CREATE UNIQUE INDEX idx_categories_name ON categories (name COLLATE NOCASE);
```

Karena `COLLATE NOCASE`, nama `"Makanan"` dan `"makanan"` dianggap duplikat.
Index di-enforce otomatis oleh D1 — tidak ada cara melewatkannya.

Keunikan nama berlaku **global lintas tipe**: `"Transfer"` (income) dan `"Transfer"`
(outcome) dianggap nama yang sama, jadi tidak bisa dibuat dua kali.

**Relasi ke transactions**

Tabel `transactions` memiliki kolom `category_id INTEGER NOT NULL` dengan foreign key
ke `categories(id)`. Ini berarti:

- Setiap transaksi harus merujuk ke kategori yang valid.
- Kategori yang masih dipakai transaksi **tidak bisa dihapus**.

## Arsitektur Kode

```
HTTP Request
     │
     ▼
categoriesController.ts  (src/routes/categoriesController.ts)
     │  Memvalidasi request body, memanggil layer DB,
     │  mengembalikan Response JSON.
     ▼
categoriesService.ts   (src/services/categoriesService.ts)
     │  Pure query functions. Menerima env (D1 binding) + param,
     │  mengembalikan data (bukan Response).
     ▼
D1 database (finance_db)
     │  SQL query dijalankan
     ▼
Response ke client
```

**Pemisahan ini penting:**
- Controller bertanggung jawab atas HTTP (validasi body, status code, format response).
- Service layer (query data) bisa dipanggil dari mana saja — termasuk `telegramController.ts` yang tidak punya
  HTTP request sendiri.

## Service Layer — `src/services/categoriesService.ts`

Fungsi-fungsi query yang tersedia:

| Fungsi | Param | Return | Query |
|--------|-------|--------|-------|
| `findById(env, id)` | `number` | `Category \| null` | `SELECT * FROM categories WHERE id = ?` |
| `findByExactName(env, name)` | `string` | `Category \| null` | `SELECT * FROM categories WHERE LOWER(name) = LOWER(?)` |
| `create(env, input)` | `CategoryInput` | `Category \| null` | `INSERT INTO categories (name, type) VALUES (?, ?)` |
| `update(env, id, input)` | `number, CategoryInput` | `Category \| null` | `UPDATE categories SET name = ?, type = ? WHERE id = ?` |

**Siapa yang menggunakan:**

- `categoriesController.ts` — `findById` (get, update, delete),
  `findByExactName` (melalui `nameExists` untuk cek duplikat),
  `create` / `update` (menulis kategori)
- `telegramController.ts` — `findByExactName` untuk resolve nama kategori dari input user
  → `category_id`
- `transactionsController.ts` — `findById` untuk validasi `category_id` + kecocokan tipe

## Controller — `src/routes/categoriesController.ts`

### Endpoint

| Method | Path              | Deskripsi              | Sukses | Error          |
|--------|-------------------|------------------------|--------|----------------|
| GET    | `/categories`     | List semua kategori    | 200    | 401, 500       |
| GET    | `/categories/:id` | Detail satu kategori   | 200    | 401, 404       |
| POST   | `/categories`     | Buat kategori baru     | 201    | 400, 401, 409  |
| PUT    | `/categories/:id` | Perbarui kategori      | 200    | 400, 401, 404, 409 |
| DELETE | `/categories/:id` | Hapus kategori         | 204    | 401, 404, 409  |

> Semua endpoint di atas **butuh sesi login** (cookie `session`). Tanpa cookie valid →
> `401 Unauthorized`. Lihat [auth.md](./auth.md).

### Format Request Body (POST / PUT)

```json
{ "name": "Makanan", "type": "outcome" }
```

### Contoh Respons

**GET /categories**
```json
[
	{ "id": 1, "name": "Makanan", "type": "outcome" },
	{ "id": 2, "name": "Transport", "type": "outcome" }
]
```

**POST /categories** (201)
```json
{ "id": 3, "name": "Gaji", "type": "income" }
```

### Validasi

| Field  | Aturan                                                    |
|--------|-----------------------------------------------------------|
| `name` | Wajib, string non-empty (di-trim), maksimal 100 karakter  |
| `type` | Wajib, hanya `income` atau `outcome`                      |

- Nama duplikat (case-insensitive, lintas tipe) → `409 Conflict`.
- Update nama yang sama dengan dirinya sendiri → diperbolehkan.

## Business Rules

1. **Unique name case-insensitive**
   `"Makanan"` dan `"makanan"` dianggap nama yang sama. Database akan menolak
   dengan error constraint jika ada percobaan insert duplikat.

2. **Tidak bisa hapus kategori yang masih dipakai**
   Sebelum menghapus, controller mengecek apakah ada transaksi yang
   menggunakan `category_id` tersebut. Jika ada → `409 Conflict` dengan pesan:
   `"Cannot delete category that is used by transactions"`.

3. **Tipe kategori menentukan tipe transaksi**
   Kategori `income` hanya boleh dipakai transaksi `income`, dan sebaliknya.
   `transactionsController.ts` menolak dengan `400 Bad Request` bila tidak cocok:
   `'Category "Gaji" is for income, but transaction type is outcome'`.
   Input Telegram juga divalidasi (lihat bawah).

## Kode Lain yang Menggunakan Categories

- **`src/routes/telegramController.ts`** — Memanggil `findByExactName(env, categoryName)`
  untuk resolve nama kategori yang diketik user di Telegram menjadi `category_id`.
  Jika tidak ditemukan → kembalikan error `{ error: 'Category "xxx" not found' }`.
  Jika tipe tidak cocok (mis. `in makanan 20000`) → error
  `{ error: 'Category "Makanan" is for outcome, but you sent income' }`.

- **`src/routes/transactionsController.ts`** — Memanggil `findById(env, category_id)`
  dari `categoriesService.ts` untuk validasi `category_id` sebelum insert/update transaksi.
  Jika kategori tidak ditemukan → `400 Bad Request` `"Category not found"`.
  Jika `category.type` tidak sama dengan `type` transaksi → `400 Bad Request`.

## Migration

| No. | File                                        | Deskripsi                                      |
|-----|---------------------------------------------|-------------------------------------------------|
| 0001 | `migrations/0001_create_categories.sql`    | Buat tabel `categories`                        |
| 0002 | `migrations/0002_unique_categories_name.sql` | Tambah unique index case-insensitive pada `name` |
| 0004 | `migrations/0004_add_category_type.sql`    | Tambah kolom `type` (default `outcome`)        |
