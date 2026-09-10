# Backend — E-Rapor TPQ Baitur Rouf Surabaya

REST API berbasis **ExpressJS** dan **MySQL** untuk Sistem E-Rapor Digital dengan metode **Simple Additive Weighting (SAW)**.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | ExpressJS 4 |
| Database | MySQL / MariaDB (driver `mysql2`, ORM Sequelize 6) |
| Autentikasi | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validasi | `express-validator` |
| PDF | `pdfkit` |

## Arsitektur

Layered architecture sesuai `Vault/design.md` §3:

```
Route → Controller → Service → Model → Database
```

- **Controller** hanya menangani request/response HTTP.
- **Service** memuat business logic, termasuk seluruh algoritma SAW — dapat diuji tanpa database.
- **Model** merupakan representasi tabel melalui Sequelize.

## Menjalankan

```bash
cd backend
cp .env.example .env          # lalu sesuaikan kredensial database
npm install

npm run db:migrate            # membuat database + 6 tabel + kriteria awal
npm run db:seed               # mengisi data contoh (12 santri, 240 nilai)
npm start                     # menjalankan server di http://localhost:5000
```

Perintah lain:

```bash
npm run dev          # mode pengembangan (nodemon)
npm run db:reset     # hapus database, migrasi ulang, lalu seed
npm run test:unit    # 17 unit test algoritma SAW (tanpa database)
npm run test:blackbox # 54 skenario black box (server harus berjalan)
```

## Konfigurasi (.env)

| Variabel | Keterangan | Contoh |
|----------|------------|--------|
| `PORT` | Port server | `5000` |
| `DB_HOST` / `DB_PORT` | Alamat MySQL | `127.0.0.1` / `3306` |
| `DB_NAME` | Nama database | `e_rapor_tpq` |
| `DB_USER` / `DB_PASSWORD` | Kredensial database | `erapor` / `…` |
| `JWT_SECRET` | Kunci penandatanganan token — **wajib diganti** di produksi | string acak ≥ 32 karakter |
| `JWT_EXPIRES_IN` | Masa berlaku token | `8h` |
| `CORS_ORIGIN` | Asal frontend yang diizinkan, pisahkan koma | `http://localhost:5173` |
| `SAW_BOBOT_TOLERANCE` | Toleransi total bobot terhadap 1 | `0.001` |

## Endpoint API

Seluruh endpoint berada di bawah prefix `/api/v1`. Ringkasan hak akses:

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/auth/login` | Semua | Login, mengembalikan JWT + halaman tujuan |
| GET | `/auth/me` | Semua (login) | Profil user saat ini |
| PUT | `/auth/password` | Semua (login) | Ubah password sendiri |
| GET/POST | `/users` | Admin | Kelola akun |
| PUT/DELETE | `/users/:id` | Admin | Ubah / hapus akun |
| GET | `/santri` | Admin, Ustadz | Daftar santri (filter `?cari=`, `?id_kelas=`) |
| POST | `/santri` | Admin, Ustadz | Tambah santri |
| PUT/DELETE | `/santri/:id` | Admin | Ubah / hapus santri |
| GET/POST/PUT/DELETE | `/santri/kelas[/:id]` | Admin | Kelola kelas |
| GET | `/nilai` | Admin, Ustadz | Daftar nilai |
| POST | `/nilai` | Admin, Ustadz | Input satu nilai |
| POST | `/nilai/batch` | Admin, Ustadz | Input banyak kriteria sekaligus |
| GET | `/nilai/perkembangan/:idSantri` | Semua (login)* | Data grafik (FR-6) |
| GET | `/nilai/periode` | Semua (login) | Daftar periode yang punya data |
| GET/POST/PUT/DELETE | `/nilai/kriteria[/:id]` | Admin | Kelola kriteria & bobot SAW |
| GET | `/saw/kriteria` | Admin, Ustadz | Kriteria aktif + validasi total bobot |
| GET | `/saw/hitung/:idSantri` | Admin, Ustadz | Hitung SAW satu santri |
| GET | `/saw/hitung-kelas/:idKelas` | Admin, Ustadz | Hitung SAW satu kelas + peringkat |
| GET | `/saw/hitung-semua` | Admin | Hitung SAW seluruh santri |
| GET | `/saw/hasil/:idSantri` | Semua (login)* | Hasil SAW tersimpan |
| GET | `/saw/peringkat/:idKelas` | Admin, Ustadz | Peringkat antar santri |
| GET | `/rapor/:idSantri/pdf` | Semua (login)* | Unduh rapor PDF (FR-7) |
| GET | `/rapor/:idSantri/data` | Semua (login)* | Pratinjau rapor (JSON) |
| GET | `/dashboard/admin` | Admin | Ringkasan + distribusi predikat |
| GET | `/dashboard/ustadz` | Admin, Ustadz | Kelas diampu + progres nilai |
| GET | `/dashboard/wali/saya` | Wali Santri | Daftar anak yang tertaut |
| GET | `/dashboard/wali/:idSantri` | Semua (login)* | Dashboard wali (FR-5) |

\* Wali santri dibatasi hanya pada data anaknya sendiri melalui middleware `ownership.middleware.js`.

### Contoh Pemanggilan

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tpqbaiturrouf.sch.id","password":"admin123"}'

# Hitung SAW (ganti <TOKEN> dengan hasil login)
curl "http://localhost:5000/api/v1/saw/hitung/1?periode=Ganjil%202025%2F2026" \
  -H "Authorization: Bearer <TOKEN>"

# Unduh PDF rapor
curl -O -J "http://localhost:5000/api/v1/rapor/1/pdf?periode=Ganjil%202025%2F2026&token=<TOKEN>"
```

## Metode SAW

Implementasi ada di `src/services/saw.service.js` dan dipisahkan menjadi dua lapisan:

1. **Fungsi murni** (`hitungSAW`, `normalisasiMatriks`, `hitungNilaiPreferensi`, `mapViKePredikat`) — tidak menyentuh database, sehingga dapat diuji unit dan dibandingkan dengan perhitungan manual.
2. **Lapisan orkestrasi** (`hitungDanSimpan`) — mengambil data dari database, memanggil fungsi murni, lalu menyimpan hasil ke tabel `hasil_saw` termasuk jejak normalisasi.

Dua basis normalisasi tersedia:

| Basis | Pembagi | Kegunaan |
|-------|---------|----------|
| `skala_penuh` | 100 (skala penilaian) | Menilai capaian individu; reproduksi contoh manual `Vault/ai.md` §4 |
| `antar_santri` | max/min antar santri pada kelas & periode yang sama | Perangkingan antar santri |

Bobot kriteria **disimpan di tabel `kriteria`** dan dapat diubah Admin melalui aplikasi — tidak di-*hardcode*. Sistem menolak perhitungan bila total bobot kriteria aktif tidak sama dengan 1.

## Struktur Folder

```
backend/
├── migrations/001-init-schema.sql   # Skema 6 tabel + data kriteria awal
├── scripts/migrate.js               # Penerapan migrasi
├── seeders/001-seed-demo.js         # Data contoh untuk pengembangan & pengujian
├── src/
│   ├── app.js                       # Konfigurasi Express (CORS, parser, route)
│   ├── server.js                    # Titik masuk + koneksi database
│   ├── config/                      # env.js, database.js
│   ├── controllers/                 # auth, santri, nilai, saw, rapor, dashboard, user
│   ├── middlewares/                 # auth (JWT), role (RBAC), ownership, validate, errorHandler
│   ├── models/                      # 6 model Sequelize + relasi
│   ├── routes/                      # Definisi endpoint per modul
│   ├── services/                    # auth, nilai, saw, rapor, grafik
│   ├── utils/                       # constants, logger, response
│   └── validations/                 # Aturan validasi input
└── tests/
    ├── unit/saw.test.js             # 17 unit test algoritma SAW
    └── blackbox/api.test.js         # 54 skenario black box
```

## Dokumentasi Terkait

- `Vault/PRD.md` — kebutuhan produk
- `Vault/design.md` — arsitektur & ERD
- `Vault/ai.md` — detail metode SAW
- `Vault/flow.md` — alur proses
- `Vault/pengujian.md` — hasil pengujian
- `Vault/history.md` — catatan setiap penambahan/perubahan
