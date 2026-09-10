# Design Document
## Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

---

## 1. Deskripsi Umum

Sistem ini adalah aplikasi web e-rapor digital untuk mengevaluasi perkembangan **tajwid** dan **akademik** santri TPQ Baitur Rouf Surabaya, menggunakan metode **Simple Additive Weighting (SAW)** untuk menghitung nilai akhir dan predikat santri secara otomatis.

## 2. Tech Stack

| Layer      | Teknologi                          |
|------------|-------------------------------------|
| Frontend   | ReactJS                             |
| Backend    | ExpressJS (Node.js)                 |
| Database   | MySQL                               |
| API        | RESTful API                         |
| Autentikasi| JWT (JSON Web Token)                |
| PDF Engine | PDFKit / Puppeteer                  |
| Metode Pengembangan | Waterfall                  |
| Metode Perhitungan  | Simple Additive Weighting (SAW) |
| Pengujian  | Black Box Testing + Perbandingan Manual vs Sistem |

## 3. Arsitektur Sistem

```
┌─────────────┐        REST API (HTTPS/JSON)       ┌──────────────┐
│   React JS   │  <------------------------------>  │  Express JS   │
│  (Frontend)  │                                     │  (Backend)    │
└─────────────┘                                     └──────┬───────┘
                                                            │
                                                     Sequelize/mysql2
                                                            │
                                                     ┌──────▼───────┐
                                                     │    MySQL      │
                                                     │  Database     │
                                                     └───────────────┘
```

**Pola arsitektur backend:** Layered Architecture
`Route → Controller → Service → Model → Database`

Tujuan pemisahan layer:
- **Controller**: menangani request/response HTTP saja.
- **Service**: berisi business logic (termasuk algoritma SAW), sehingga bisa diuji secara independen (unit test) dan dibandingkan dengan hasil perhitungan manual.
- **Model**: representasi tabel database.

## 4. Role & Hak Akses (RBAC)

| Role             | Hak Akses                                                                 |
|------------------|-----------------------------------------------------------------------------|
| Admin            | Kelola user, kelola kriteria & bobot, kelola kelas, lihat semua data       |
| Ustadz/Ustadzah  | Input data santri, input nilai per kriteria per pertemuan, lihat rapor    |
| Wali Santri      | Lihat dashboard, rapor, dan grafik perkembangan anaknya saja               |

## 5. Skema Database (ERD Ringkas)

### Tabel: `users`
| Kolom       | Tipe          | Keterangan                          |
|-------------|---------------|---------------------------------------|
| id          | INT (PK)      | Auto increment                        |
| nama        | VARCHAR(100)  |                                        |
| email       | VARCHAR(100)  | Unique                                 |
| password    | VARCHAR(255)  | Hashed (bcrypt)                        |
| role        | ENUM          | admin, ustadz, wali_santri             |
| created_at  | TIMESTAMP     |                                        |

### Tabel: `santri`
| Kolom        | Tipe          | Keterangan                         |
|--------------|---------------|--------------------------------------|
| id           | INT (PK)      |                                       |
| nis          | VARCHAR(20)   | Nomor induk santri                   |
| nama         | VARCHAR(100)  |                                       |
| tempat_lahir | VARCHAR(100)  |                                       |
| tanggal_lahir| DATE          |                                       |
| jenis_kelamin| ENUM          | L, P                                  |
| id_kelas     | INT (FK)      | -> kelas.id                           |
| id_wali      | INT (FK)      | -> users.id (role wali_santri)        |

### Tabel: `kelas`
| Kolom     | Tipe         | Keterangan          |
|-----------|--------------|---------------------|
| id        | INT (PK)     |                     |
| nama_kelas| VARCHAR(50)  |                     |
| id_ustadz | INT (FK)     | -> users.id          |

### Tabel: `kriteria`
| Kolom      | Tipe          | Keterangan                                 |
|------------|---------------|-----------------------------------------------|
| id         | INT (PK)      |                                                 |
| kode       | VARCHAR(10)   | C1, C2, dst                                    |
| nama       | VARCHAR(100)  | mis: Makhraj, Tajwid, Kelancaran, Hafalan, Akademik |
| bobot      | DECIMAL(4,2)  | Bobot kriteria (total seluruh bobot = 1)       |
| jenis      | ENUM          | benefit / cost                                 |

### Tabel: `nilai`
| Kolom        | Tipe          | Keterangan                          |
|--------------|---------------|----------------------------------------|
| id           | INT (PK)      |                                        |
| id_santri    | INT (FK)      | -> santri.id                          |
| id_kriteria  | INT (FK)      | -> kriteria.id                        |
| id_ustadz    | INT (FK)      | -> users.id                           |
| skor         | DECIMAL(5,2)  | Nilai mentah (0-100)                  |
| pertemuan_ke | INT           |                                        |
| periode      | VARCHAR(20)   | mis: "Ganjil 2025/2026"               |
| tanggal      | DATE          |                                        |

### Tabel: `hasil_saw`
| Kolom         | Tipe          | Keterangan                              |
|---------------|---------------|--------------------------------------------|
| id            | INT (PK)      |                                            |
| id_santri     | INT (FK)      | -> santri.id                              |
| periode       | VARCHAR(20)   |                                            |
| nilai_akhir   | DECIMAL(5,4)  | Hasil preferensi (Vi) SAW                 |
| predikat      | ENUM          | Sangat Baik, Baik, Cukup, Kurang           |
| ranking       | INT           | (opsional, jika dibandingkan antar santri) |
| generated_at  | TIMESTAMP     |                                            |

## 6. Relasi Antar Tabel

```
users (1) ── (N) santri        [sebagai wali]
kelas (1) ── (N) santri
users (1) ── (N) kelas         [sebagai ustadz]
santri (1) ── (N) nilai
kriteria (1) ── (N) nilai
santri (1) ── (N) hasil_saw
```

## 7. Desain API Endpoint (Ringkas)

| Method | Endpoint                        | Role Akses          | Keterangan                     |
|--------|----------------------------------|----------------------|---------------------------------|
| POST   | /api/v1/auth/login               | Semua                | Login                           |
| GET    | /api/v1/santri                   | Admin, Ustadz         | Daftar santri                   |
| POST   | /api/v1/santri                   | Admin                 | Tambah santri                   |
| POST   | /api/v1/nilai                    | Ustadz                | Input nilai per kriteria        |
| GET    | /api/v1/saw/hitung/:idSantri      | Admin, Ustadz         | Trigger & ambil hasil SAW       |
| GET    | /api/v1/rapor/:idSantri/pdf       | Wali, Ustadz, Admin   | Cetak rapor PDF                 |
| GET    | /api/v1/dashboard/wali/:idSantri  | Wali Santri           | Dashboard & grafik perkembangan |

## 8. Desain UI (Ringkas per Role)

- **Login**: satu halaman, redirect otomatis sesuai role.
- **Dashboard Admin**: ringkasan jumlah santri, kelas, ustadz, grafik distribusi predikat.
- **Dashboard Ustadz**: daftar santri per kelas, form input nilai per kriteria per pertemuan.
- **Dashboard Wali Santri**: kartu rapor anak, grafik tren nilai per periode, tombol unduh PDF.

## 9. Non-Functional Requirements

- Response API rata-rata < 1 detik untuk operasi CRUD standar.
- Password disimpan ter-enkripsi (bcrypt).
- Autentikasi menggunakan JWT dengan token expiry.
- Validasi input di sisi backend (express-validator/Joi) dan frontend.
- Struktur kode modular agar mudah diuji (unit test service SAW).
