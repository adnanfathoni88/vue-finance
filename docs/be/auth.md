# Auth

Modul autentikasi memakai **password tunggal** (single admin) dan **sesi berbasis cookie
stateless**. Endpoint `/me`, `/categories`, dan `/transactions` dilindungi middleware
`requireAuth`; endpoint `/logout` terbuka (tidak butuh sesi valid).

- Password disimpan sebagai hash **PBKDF2-HMAC-SHA256** di secret `APP_PASSWORD_HASH`.
- Login sukses → server membuat **token sesi** bertanda tangan **HMAC-SHA256** dan
  mengirimnya lewat cookie `session`.
- Token berisi payload `{ sub, iat, exp }` dan berlaku **1 hari (86.400 detik)**.
- Tidak ada penyimpanan sesi di server (stateless): verifikasi cukup dari signature + `exp`.

## Konfigurasi & Secrets

| Nama                | Jenis Secret | Format                                          |
|---------------------|--------------|-------------------------------------------------|
| `APP_PASSWORD_HASH` | Ya           | `pbkdf2$sha256$<iterasi>$<salt_base64>$<hash_base64>` |
| `SESSION_SECRET`    | Ya           | String acak (mis. 32 byte base64)               |

**Lokal** — simpan di `.dev.vars` (sudah di-gitignore):

```
APP_PASSWORD_HASH=pbkdf2$sha256$75000$<salt_base64>$<hash_base64>
SESSION_SECRET=<string_acak>
```

**Generate hash** — `scripts/generate-password-hash.ts` (interaktif):

```sh
npx tsx scripts/generate-password-hash.ts
# atau non-interaktif:
APP_PASSWORD='passwordkamu' npx tsx scripts/generate-password-hash.ts
```

Script memakai `crypto.pbkdf2Sync(password, salt, 75_000, 32, 'sha256')` dan mencetak
baris `APP_PASSWORD_HASH=...` yang tinggal disalin ke `.dev.vars`.

**Produksi** — set sebagai secret (jangan lewat `wrangler.jsonc` `vars`):

```sh
npx wrangler secret put APP_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
```

Setelah mengubah `.dev.vars`, jalankan `npx wrangler types` agar `Env` ikut ter-update.

### Catatan Benchmark PBKDF2

Diukur di workerd lokal (avg dari 5 run):

| Iterations | avg     |
|------------|---------|
| 50.000     | 2.60 ms |
| 75.000     | 4.00 ms |
| 100.000    | 5.40 ms |
| 600.000    | 33.00 ms|

Dipilih **75.000** sebagai keseimbangan keamanan vs CPU. Workers Free memiliki CPU limit
**10 ms**, sehingga 600.000 berisiko `Error 1102` (aman hanya di Workers Paid, default 30 s).
Nilai `iterations` disimpan di dalam string hash, jadi `verifyPassword` otomatis mengikuti
angka tersebut tanpa perlu diubah di kode.

## Arsitektur Kode

```
HTTP Request (POST /login)
     │
     ▼
loginController.ts  (src/routes/loginController.ts)
     │  Parse body → verifyPassword() → buildSession()
     │  Set-Cookie: session=<token>
     ▼
authService.ts  (src/services/authService.ts)
     │  PBKDF2 (Web Crypto) + HMAC-SHA256
     ▼
Response + cookie ke client

HTTP Request (GET /categories)
     │
     ▼
requireAuth  (src/middleware/requireAuth.ts)
     │  readSessionCookie() → verifySessionToken()
     │  Tidak valid → 401
     ▼
categoriesController.ts → ... (handler tetap)
```

## Endpoint

| Method | Path     | Deskripsi                          | Sukses | Error     |
|--------|----------|------------------------------------|--------|-----------|
| GET    | `/login` | Halaman login (placeholder teks)   | 200    | —         |
| POST   | `/login` | Verifikasi password + buat sesi    | 200    | 400, 401  |
| POST   | `/logout`| Hapus cookie sesi                  | 200    | —         |
| GET    | `/me`    | Cek sesi + identitas admin         | 200    | 401       |

### Request Body (POST /login)

```json
{ "password": "passwordkamu" }
```

`password` wajib string non-empty.

### Contoh Respons per Endpoint

**GET /login — sukses (200)** (`Content-Type: text/plain`):

```
ini halaman login
```

**POST /login — sukses (200)** + header `Set-Cookie`:

```json
{ "authenticated": true, "sub": "admin", "iat": 1757000000, "exp": 1757086400 }
```

```
Set-Cookie: session=<payload>.<signature>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400
```

Atribut `Secure` ditambahkan otomatis bila request melalui HTTPS. Saat `wrangler dev`
(`http://localhost`) `Secure` tidak dipasang agar cookie bisa dipakai untuk testing.

**POST /login — body tanpa `password` (400):**

```json
{ "error": { "message": "Field \"password\" is required", "status": 400 } }
```

**POST /login — password salah (401):**

```json
{ "error": { "message": "Invalid password", "status": 401 } }
```

**POST /logout — sukses (200)** + header `Set-Cookie` pengosong:

```json
{ "ok": true }
```

```
Set-Cookie: session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```

**GET /me — sukses (200)** (dengan header `Cache-Control: no-store`):

```json
{ "authenticated": true, "sub": "admin", "iat": 1757000000, "exp": 1757086400 }
```

**GET /me — tanpa / sesi tidak valid (401):**

```json
{ "error": { "message": "Invalid or expired session", "status": 401 } }
```

**Endpoint protected tanpa cookie (mis. GET /categories) (401):**

```json
{ "error": { "message": "Authentication required", "status": 401 } }
```

Format error semua endpoint seragam: `{ "error": { "message", "status" } }` (lihat
[Verifikasi Sesi — `requireAuth`](#verifikasi-sesi--requireauth)).

## Alur Login (`POST /login`)

1. `parseJsonBody` membaca body; `password` harus string non-empty → jika tidak, `400`.
2. `verifyPassword(password, env.APP_PASSWORD_HASH)`:
   - Parse `pbkdf2$sha256$<iterasi>$<salt>$<hash>`.
   - Derive ulang dengan Web Crypto `crypto.subtle.deriveBits` (`hash: 'SHA-256'`, salt sama).
   - Bandingkan hasil dengan hash tersimpan secara **constant-time**.
3. Jika tidak cocok → `401 Invalid password`.
4. `buildSession(env.SESSION_SECRET)` membuat token (payload + signature HMAC) sekaligus
   mengembalikan `{ token, payload }`.
5. Balas `{ authenticated: true, sub, iat, exp }` + `Set-Cookie: session=<token>`.

## Verifikasi Sesi — `requireAuth`

`src/middleware/requireAuth.ts` membungkus handler dan dipasang di `src/index.ts`:

```ts
import { requireAuth } from './middleware/requireAuth';

.get('/categories', requireAuth(listCategories))
.post('/transactions', requireAuth(createTransaction))
```

Alur:

1. `readSessionCookie(request)` mengambil nilai cookie `session`; jika tidak ada → `401`.
2. `verifySessionToken(secret, token)`:
   - Hitung ulang HMAC-SHA256 payload, bandingkan signature secara constant-time.
   - Decode payload dan pastikan `exp` belum lewat.
3. Jika valid → lanjut ke handler; jika tidak → `401 Invalid or expired session`.

## Endpoint `/me`

`GET /me` adalah endpoint **protected** untuk mengecek keabsahan sesi sekaligus
mengembalikan identitas pemilik sesi. Endpoint ini **tidak menyentuh database** —
verifikasi hanya dari signature token + `exp` (stateless).

Dipakai frontend untuk menentukan status login saat halaman di-refresh maupun dibuka
ulang, karena cookie `session` bersifat `HttpOnly` dan tidak bisa dibaca JavaScript.

| Method | Path  | Deskripsi                  | Sukses | Error |
|--------|-------|----------------------------|--------|-------|
| GET    | `/me` | Cek sesi + identitas admin | 200    | 401   |

- **Auth:** wajib cookie `session` valid (dibungkus `requireAuth`, sama seperti
  `/categories` dan `/transactions`).
- **Request body:** tidak ada.
- **Header respons tambahan:** `Cache-Control: no-store`.

### Contoh Respons

**GET /me — sukses (200):**

```json
{
  "authenticated": true,
  "sub": "admin",
  "iat": 1757000000,
  "exp": 1757086400
}
```

`sub`, `iat`, dan `exp` berasal langsung dari payload sesi hasil
`verifySessionToken()` (lihat [Session Token](#session-token)). Tidak ada data
sensitif lain yang dikembalikan.

**GET /me — tanpa / sesi tidak valid (401):**

```json
{ "error": { "message": "Invalid or expired session", "status": 401 } }
```

Format error identik dengan endpoint protected lain (lihat
[Verifikasi Sesi — `requireAuth`](#verifikasi-sesi--requireauth)).

### Alur Verifikasi

```
GET /me
   │
   ▼
requireAuth  (src/middleware/requireAuth.ts)
   │  readSessionCookie(request) → verifySessionToken(secret, token)
   │  Tidak valid → 401
   ▼
meController  (src/routes/meController.ts)
   │  Kembalikan payload sesi + { authenticated: true }
   ▼
200 { authenticated, sub, iat, exp }
```

### Implementasi

Dua opsi, keduanya tidak mengubah mesin auth yang ada:

**Opsi A — handler memverifikasi sendiri**

`meController` memanggil `readSessionCookie()` + `verifySessionToken()` lalu
mengembalikan payload. Sederhana, namun token diparse ulang setelah `requireAuth`.

**Opsi B — `requireAuth` meneruskan payload sesi (disarankan)**

Ubah `requireAuth` agar meneruskan `session` ke handler:

```ts
// src/middleware/requireAuth.ts
const session = await verifySessionToken(env.SESSION_SECRET, token);
if (!session) return unauthorized();
return handler(request, env, ctx, session);
```

```ts
// src/index.ts
.get('/me', requireAuth(meController))
// meController(request, env, ctx, session) → json({ authenticated: true, ...session })
```

Menghindari parsing token dua kali dan membuat `sub` tersedia bagi handler lain
yang mungkin membutuhkannya.

### Catatan untuk Frontend

- Panggil API lewat **path relatif** (`/api/...`) pada origin yang sama — lihat
  [Deployment: same-origin proxy](#deployment-same-origin-proxy). Dengan same-origin,
  cookie terkirim otomatis sehingga **tidak** perlu `withCredentials` maupun CORS.
- Panggil `/me` sekali saat startup (mis. di `router.beforeEach`) dan simpan
  hasilnya sebagai state auth; dedupe request yang berjalan bersamaan.
- `200` → tandai login; `401` → redirect ke `/login?redirect=<path>` untuk route
  protected.
- Jangan jadikan flag `localStorage` sebagai sumber kebenaran — tetap konfirmasi
  via `/me`, karena cookie bisa saja sudah kedaluwarsa.
- Untuk logout, panggil `POST /logout`, lalu bersihkan state auth lokal dan redirect ke
  `/login`. Respons tetap `200` walau cookie sudah kedaluwarsa.

## Endpoint `/logout`

`POST /logout` menghapus cookie sesi di browser. Endpoint ini **publik** (tidak
dibungkus `requireAuth`) dan **idempoten**, sehingga sesi yang sudah kedaluwarsa pun
tetap bisa logout dengan bersih.

| Method | Path       | Deskripsi             | Sukses | Error |
|--------|------------|-----------------------|--------|-------|
| POST   | `/logout`  | Hapus cookie `session`| 200    | —     |

- **Auth:** tidak perlu cookie valid.
- **Request body:** tidak ada.
- **Respons:** `{ "ok": true }` + header `Set-Cookie` pengosong.

### Contoh Respons

**POST /logout — sukses (200):**

```json
{ "ok": true }
```

```
Set-Cookie: session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```

Atribut `Secure` ditambahkan bila request melalui HTTPS. Karena endpoint publik, respons
tetap `200` walau cookie tidak ada atau sudah kedaluwarsa.

Karena sesi bersifat stateless, logout hanya menghapus cookie di klien; token yang sudah
terbit tetap valid sampai `exp` karena tidak ada blocklist di server (lihat
[Limitasi saat ini](#limitasi-saat-ini)).

## API `src/services/authService.ts`

| Fungsi | Param | Return | Keterangan |
|--------|-------|--------|------------|
| `hashPassword(password, iterations)` | `string, number` | `Promise<string>` | Buat hash format `pbkdf2$sha256$...` |
| `verifyPassword(password, stored)` | `string, string` | `Promise<boolean>` | Derive + bandingkan constant-time |
| `buildSession(secret, ttl?, sub?)` | `string, number?, string?` | `Promise<{ token, payload }>` | Buat token + payload sesi |
| `createSessionToken(secret, ttl?, sub?)` | `string, number?, string?` | `Promise<string>` | Wrapper `buildSession`, kembalikan token saja |
| `verifySessionToken(secret, token)` | `string, string` | `Promise<SessionPayload \| null>` | Cek signature + `exp` |
| `buildSessionCookie(token, secure?, maxAge?)` | `string, boolean?, number?` | `string` | Rangkai header `Set-Cookie` |
| `buildClearSessionCookie(secure?)` | `boolean?` | `string` | `Set-Cookie` pengosong (`Max-Age=0`) |
| `readSessionCookie(request)` | `Request` | `string \| null` | Ambil cookie `session` |
| `constantTimeEqual(a, b)` | `Uint8Array, Uint8Array` | `boolean` | Perbandingan tanpa short-circuit |

Konstanta: `SESSION_COOKIE = 'session'`, `SESSION_TTL_SECONDS = 86400`.

## Session Token

Format: `base64url(JSON payload).base64url(HMAC-SHA256(payload, SESSION_SECRET))`

```json
{ "sub": "admin", "iat": 1757000000, "exp": 1757086400 }
```

- `sub` — subjek sesi (default `admin`).
- `iat` — waktu terbit (unix detik).
- `exp` — waktu kedaluwarsa (unix detik, `iat + 86400`).

Signature mencegah pemalsuan; `exp` mencegah pemakaian token lama. Karena stateless, tidak
ada query DB saat memverifikasi.

## Business Rules & Keamanan

1. **Password tidak pernah disimpan/di-log sebagai plaintext** — hanya hash PBKDF2.
2. **Perbandingan constant-time** untuk hash password dan signature sesi.
3. **Rotasi `SESSION_SECRET`** → semua sesi yang beredar langsung tidak valid.
4. **Ganti password** → jalankan ulang script generator dan perbarui `APP_PASSWORD_HASH`.
5. **Cookie** `HttpOnly` (tidak bisa dibaca JS), `SameSite=Lax`, `Path=/`, `Max-Age=86400`.

### Limitasi saat ini

- Belum ada refresh token atau rate limiting pada `POST /login`.
- Logout hanya menghapus cookie di klien; token yang sudah terbit tetap valid sampai
  `exp` (tidak ada blocklist sesi).
- Cookie memakai `SameSite=Lax`, jadi FE **wajib** diakses same-origin dengan API
  (lihat [Deployment: same-origin proxy](#deployment-same-origin-proxy)). Panggilan
  langsung cross-site (`pages.dev` → `workers.dev`) **tidak didukung** karena cookie
  `SameSite=None` adalah third-party cookie yang diblokir Safari/Firefox.

## Testing

Test auth ada di `test/index.spec.ts` (berjalan di workerd via `@cloudflare/vitest-plugin`):

- `GET /login` mengembalikan halaman login.
- Endpoint protected tanpa cookie → `401`.
- Cookie dengan token tidak valid → `401`.
- Login password salah → `401`; tanpa `password` → `400`.
- Login password benar → `200`, `Set-Cookie` terisi, dan token valid saat diverifikasi.

Helper `withSessionCookie(request)` membuat token via `createSessionToken(env.SESSION_SECRET)`
dan menempelkannya ke header `Cookie`, dipakai oleh test categories/transactions.

## File Terkait

| File | Peran |
|------|-------|
| `src/routes/loginController.ts` | Handler `GET/POST /login` |
| `src/services/authService.ts` | PBKDF2, token sesi, helper cookie |
| `src/middleware/requireAuth.ts` | Guard route protected |
| `src/routes/meController.ts` | Handler `GET /me` (cek sesi) |
| `src/routes/logoutController.ts` | Handler `POST /logout` |
| `src/routes/categoriesController.ts` / `transactionsController.ts` | Handler yang dilindungi |
| `scripts/generate-password-hash.ts` | Generator `APP_PASSWORD_HASH` |
