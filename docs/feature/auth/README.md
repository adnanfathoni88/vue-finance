# Fitur Auth — Dokumentasi Project Vue Finance

Dokumen ini menjelaskan integrasi autentikasi di frontend (`vue-finance`) dengan
Backend REST (Cloudflare Worker + D1). Kontrak BE lengkap ada di `docs/be/auth.md`.

## Ringkasan

| Halaman | Route | Komponen | Fungsi |
|---------|-------|----------|--------|
| Login | `/login` | `LoginPage.vue` | Input password, buat sesi |
| Protected | `/`, `/transactions`, `/all-transactions`, `/categories` | `DashboardPage`, `TransactionsPage`, `AllTransaction`, `CategoriesPage` | Butuh sesi valid |

Seluruh route protected memakai `meta.requiresAuth`; route `/login` memakai
`meta.guestOnly`.

## Arsitektur & Alur Data

Frontend **tidak memanggil Worker secara langsung**. Semua request lewat path relatif
`/api/*` dan diteruskan oleh proxy same-origin, sehingga cookie `session` bersifat
**first-party** dan bebas CORS.

```
Browser (same-origin)
   │  /api/login, /api/me, /api/logout, /api/categories, /api/transactions
   ▼
Proxy:  dev  = Vite server.proxy
        prod = Cloudflare Pages Function (functions/api/[[path]].js)
   │  rewrite /api/* → /* ; forward Cookie ; teruskan Set-Cookie
   ▼
Worker finance-bot + D1
```

## Konfigurasi Environment

| Variabel | Nilai | Peran |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `/api` | Base URL FE (relatif ke proxy). Contoh di `.env.example` |
| `API_ORIGIN` | `https://finance-bot.katmanfatahoni.workers.dev` | Env Pages Function, target proxy produksi |

- **Dev:** `vite.config.js` mem-proxy `/api` → `http://localhost:8787` (wrangler dev)
  dan me-rewrite prefix `/api` menjadi `/`.
- **Prod:** `functions/api/[[path]].js` meneruskan ke `API_ORIGIN` dengan membuang
  header `host`/`origin`/`referer`.

## File Terkait

| File | Peran |
|------|-------|
| `src/services/api.js` | Instance axios (`withCredentials`), helper `login`/`me`/`logout`, interceptor 401 |
| `src/composables/useAuth.js` | State sesi + `login`, `logout`, `ensureSession`, `clear` |
| `src/pages/LoginPage.vue` | Form login + redirect |
| `src/router/index.js` | Route + `meta`, guard `beforeEach` |
| `src/main.js` | Registrasi handler 401 global |
| `src/components/Header.vue` | Navigasi + tombol Logout, tampil saat login |
| `functions/api/[[path]].js` | Proxy produksi ke Worker |
| `vite.config.js` | Proxy dev |

## Alur

### 1. Startup / Refresh — `ensureSession()`

Guard `router.beforeEach` memanggil `ensureSession()` untuk route auth/guest.
Fungsi ini memanggil `GET /api/me` **sekali** (di-dedupe dengan `sessionPromise`) lalu
menyimpan hasilnya di state:

- `200` → `state.user` terisi, `isAuthenticated = true`.
- `401` → `state.user = null`.

Karena cookie `HttpOnly` tidak bisa dibaca JavaScript, `/me` adalah satu-satunya cara
mengetahui status login saat halaman dimuat ulang.

### 2. Login (`/login`)

1. User submit password → `useAuth.login(password)` → `POST /api/login`.
2. Sukses (`{ authenticated, sub, iat, exp }`) → state diisi, `checked = true`.
3. Redirect ke `?redirect=` (disanitasi, hanya path internal) atau `/`.
4. Gagal → pesan dari `{ error.message }` (mis. `Invalid password`).

### 3. Guard Route

- Route `requiresAuth` & belum login → redirect `/login?redirect=<fullPath>`.
- Route `guestOnly` (`/login`) & sudah login → redirect Dashboard.
- Belum login → `Header` tidak dirender.

### 4. Interceptor 401 Global

`src/services/api.js` menangkap respons `401` (kecuali `/login`, `/logout`, `/me`)
lalu memanggil handler yang didaftarkan di `src/main.js`:

- Bersihkan state (`clear()`).
- Redirect ke `/login?redirect=<path saat ini>`.
- Dilindungi flag `redirecting` (anti-loop) dan di-skip bila sudah di halaman Login.

### 5. Logout

Tombol Logout di `Header.vue` → `useAuth.logout()` → `POST /api/logout` (publik,
idempoten) → `clear()` → redirect `/login`.

## Status Fase

| Fase | Status | Keterangan |
|------|--------|------------|
| 0. Proxy `/api` (dev + Pages Function) | ✅ | Cookie first-party, bebas CORS |
| 1. API service terpusat | ✅ | Semua komponen memakai `src/services/api.js` |
| 2. Halaman Login + state sesi | ✅ | `LoginPage.vue`, `useAuth` |
| 3. Route guard + `/me` | ✅ | `ensureSession`, `meta.requiresAuth` |
| 4. Interceptor 401 global | ✅ | `setUnauthorizedHandler` + anti-loop |
| 5. Logout + dokumentasi | ✅ | Tombol Logout + dokumen ini |

## Catatan & Limitasi

- Sesi stateless: token yang sudah terbit tetap valid sampai `exp` (1 hari) karena tidak
  ada blocklist di server; logout hanya menghapus cookie di klien.
- Belum ada rate limiting pada `POST /login` (lihat `docs/be/auth.md`).
- `withCredentials: true` tetap dipasang walaupun proxy same-origin, untuk kompatibilitas
  bila sewaktu-waktu memanggil BE langsung.
