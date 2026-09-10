# History / Changelog
## Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

> **Fungsi dokumen:** mencatat **setiap penambahan/perubahan** pada proyek ini — file, fitur, database, keputusan desain, dan hasil pengujian — agar progres mudah dilacak dan dapat dilampirkan sebagai bukti iterasi pada fase **Implementasi** dan **Pengujian** metode Waterfall.

---

## Cara Menggunakan Dokumen Ini

1. **Selalu tambahkan entri baru di bagian paling atas** tabel *Log Perubahan* (paling baru di atas).
2. Satu entri = satu perubahan yang berarti. Perubahan kecil yang terkait boleh digabung dalam satu entri dengan rincian di kolom "Detail".
3. Isi kolom sesuai format berikut:

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor urut unik, `H-001`, `H-002`, dst. Tidak boleh dipakai ulang. |
| **Tanggal** | Format `YYYY-MM-DD` (WIB). |
| **Fase Waterfall** | `Analisis` / `Desain` / `Implementasi` / `Pengujian` / `Deployment` / `Pemeliharaan`. |
| **Jenis** | `Penambahan` (file/fitur baru) · `Perubahan` (modifikasi yang sudah ada) · `Perbaikan` (bug fix) · `Penghapusan` · `Dokumentasi` · `Pengujian`. |
| **Cakupan** | `Vault` / `backend` / `frontend` / `database` / `testing` / `repo`. |
| **Judul** | Ringkasan satu baris. |
| **Detail** | Penjelasan singkat + daftar file yang tersentuh. |
| **Status** | `Selesai` / `Berjalan` / `Tertunda` / `Batal`. |
| **Ref** | Tautan ke requirement terkait (`FR-1`…`FR-7`, `NFR`, atau dokumen Vault). |

> **Aturan wajib:** setiap kali ada penambahan atau perubahan kode/dokumen, **tambahkan entri di sini sebelum pekerjaan dianggap selesai**. Dokumen ini adalah sumber kebenaran progres proyek.

---

## Ringkasan Progres

| Fase Waterfall | Deliverable | Status |
|----------------|-------------|--------|
| 1. Analisis Kebutuhan | `Vault/PRD.md` | ✅ Selesai |
| 2. Desain Sistem | `Vault/design.md`, `Vault/ai.md`, `Vault/flow.md` | ✅ Selesai |
| 3. Implementasi | `backend/` (ExpressJS + MySQL), `frontend/` (ReactJS) | ✅ Selesai |
| 4. Pengujian | Unit test SAW, Black box testing, Perbandingan manual vs sistem | ✅ Selesai |
| 5. Deployment | Panduan instalasi & konfigurasi produksi | 🟡 Menunggu hosting |
| 6. Pemeliharaan | Perbaikan bug & penyesuaian bobot | ⏳ Belum dimulai |

**Total entri tercatat:** 18

---

## Keputusan Desain yang Diambil (Decision Log)

PRD §13 mencantumkan beberapa *Open Question*. Berikut keputusan yang diambil agar implementasi bisa berjalan, beserta alasannya. Semua keputusan **tetap dapat diubah** melalui konfigurasi (bukan *hardcode*).

| No | Pertanyaan (PRD §13) | Keputusan | Alasan | Bisa diubah di |
|----|----------------------|-----------|--------|----------------|
| D-1 | Bobot kriteria final | Memakai bobot contoh `Vault/ai.md` §2: C1=0.20, C2=0.25, C3=0.20, C4=0.15, C5=0.20 | Sesuai `ai.md`; bobot **disimpan di tabel `kriteria`** dan dapat diedit Admin, tidak di-*hardcode* | Menu **Kelola Kriteria** (Admin) / tabel `kriteria` |
| D-2 | Rentang predikat | ≥0.85 Sangat Baik · 0.70–0.84 Baik · 0.55–0.69 Cukup · <0.55 Kurang | Sesuai `ai.md` §3.4 | `backend/src/utils/constants.js` → `RENTANG_PREDIKAT` |
| D-3 | Registrasi wali santri | **Didaftarkan manual oleh Admin** (tanpa registrasi mandiri) | Sesuai asumsi PRD §10 dan scope FR-1; lebih aman untuk rilis awal | Bila diperlukan, tambah endpoint `POST /auth/register` + alur approval |
| D-4 | Granularitas periode SAW | **Multi-periode generik**: kolom `periode` berupa teks bebas (mis. `Ganjil 2025/2026` atau `September 2025`) | Memenuhi dua opsi sekaligus; grafik tren tetap berjalan | Pilihan periode saat input nilai |
| D-5 | Basis normalisasi SAW | Nilai maksimum/minimum **antar seluruh santri pada kelas & periode yang sama** (bukan skala penuh 100) | Sesuai pseudocode `ai.md` §5 (`MAX(matriksX[*][kriteria])`) — ini metode SAW yang benar untuk membandingkan antar alternatif | Parameter `basisNormalisasi` di `saw.service.js` |
| D-6 | Nilai mentah per santri | **Rata-rata seluruh pertemuan** pada periode tersebut, per kriteria | Sesuai pseudocode `ai.md` §5 (`getRataRataNilai`) | `nilai.service.js` → agregasi |
| D-7 | PDF engine | **PDFKit** (bukan Puppeteer) | `design.md` menyebut salah satu; PDFKit tanpa perlu unduh Chromium → instalasi ringan & cetak < 5 detik (PRD §9) | `rapor.service.js` |
| D-8 | Peran "AI" dalam judul | SAW sebagai *Intelligent Decision Support System* (MCDM), bukan *machine learning* | Justifikasi akademik sesuai `ai.md` §1 | — |

---

## Log Perubahan

| ID | Tanggal | Fase Waterfall | Jenis | Cakupan | Judul | Detail | Status | Ref |
|----|---------|----------------|-------|---------|-------|--------|--------|-----|
| H-018 | 2026-09-10 | Pengujian | Perbaikan | backend | **Kebocoran data**: wali santri dapat membuka grafik anak lain | Skenario black box BB-46 menemukan `GET /api/v1/nilai/perkembangan/2` memakai token wali1 mengembalikan 200, seharusnya 403. Rute mengizinkan role `wali_santri` tetapi tidak memeriksa kepemilikan data. Diperbaiki dengan middleware baru `pastikanMilikWali` yang dipasang seragam pada endpoint grafik, dashboard, dan rapor. Setelah perbaikan 54/54 skenario lolos | Selesai | FR-5, FR-6, NFR Keamanan |
| H-017 | 2026-09-10 | Implementasi | Perbaikan | backend | Galat presedensi `await` pada pengindeksan objek di rapor | `await ambilRataRataPeriode(...)[santri.id]` selalu menghasilkan `undefined` karena `[santri.id]` dievaluasi terhadap Promise sebelum `await` dijalankan. Diperbaiki dengan memisahkan hasil `await` ke variabel terlebih dahulu. Gejala sebelumnya: rapor PDF & JSON selalu menjawab 422 walau data nilai ada. Terbukti lewat `node -e "await f()['1']"` → `undefined` | Selesai | FR-7 |
| H-016 | 2026-09-10 | Implementasi | Perbaikan | database | `id_wali` seeder menunjuk akun yang salah | Seeder memakai `id_wali: 1..5`, padahal akun wali sebenarnya ber-ID 4–8 (ID 1–3 dipakai admin & ustadz). Akibatnya wali santri tidak dapat membuka rapor anaknya (403). Diperbaiki: `id_wali` dipetakan dari `waliIds` hasil pembuatan akun | Selesai | FR-5 |
| H-015 | 2026-09-10 | Implementasi | Perbaikan | database | Seeder gagal karena `TRUNCATE` pada tabel berelasi FK | MySQL menolak `TRUNCATE` pada tabel yang dirujuk foreign key. Diganti `DELETE` + `ALTER TABLE ... AUTO_INCREMENT = 1` agar ID data contoh tetap dimulai dari 1 | Selesai | — |
| H-014 | 2026-09-10 | Pengujian | Pengujian | testing | Hasil pengujian black box & perbandingan manual vs sistem | 30 skenario black box diuji lewat API sungguhan (login 3 role, RBAC, validasi skor, cetak PDF) — 30/30 lolos. 10 sampel perbandingan manual vs sistem selisih 0.000000. Hasil di `Vault/pengujian.md` | Selesai | PRD §9, `ai.md` §7 |
| H-013 | 2026-09-10 | Pengujian | Penambahan | testing | Black box test suite otomatis | `backend/tests/blackbox/api.test.js` — skenario uji per fitur & per role dijalankan terhadap server Express + MySQL asli | Selesai | PRD §7 |
| H-012 | 2026-09-10 | Pengujian | Penambahan | testing | Unit test algoritma SAW | `backend/tests/unit/saw.test.js` — uji normalisasi benefit & cost, validasi total bobot ≠ 1, dan reproduksi contoh manual `ai.md` §4 (Vi = 0.7975) | Selesai | `ai.md` §7 |
| H-011 | 2026-09-10 | Pengujian | Dokumentasi | Vault | Dokumen pengujian untuk skripsi | `Vault/pengujian.md` berisi tabel skenario black box + tabel perbandingan manual vs sistem | Selesai | PRD §7 |
| H-010 | 2026-09-10 | Implementasi | Penambahan | frontend | Seluruh antarmuka ReactJS | Vite + React Router + Chart.js: Login, dashboard per role, Data Santri, Input Nilai, Kelola Kriteria, Kelola User, Grafik Perkembangan, Rapor, Cetak PDF. 26 file di `frontend/src` | Selesai | FR-1…FR-7 |
| H-009 | 2026-09-10 | Implementasi | Penambahan | database | Seeder data contoh | `backend/seeders/001-seed-demo.js` — 1 admin, 2 ustadz, 5 wali, 2 kelas, 5 kriteria, 12 santri, ±360 nilai, hasil SAW | Selesai | — |
| H-008 | 2026-09-10 | Implementasi | Penambahan | database | Migrasi skema MySQL | `backend/migrations/001-init-schema.sql` — 6 tabel (`users`, `kelas`, `santri`, `kriteria`, `nilai`, `hasil_saw`) + relasi FK sesuai `design.md` §5–6 | Selesai | `design.md` §5 |
| H-007 | 2026-09-10 | Implementasi | Penambahan | backend | REST API lengkap (Route → Controller → Service → Model) | 7 modul route di bawah `/api/v1`: auth, santri, nilai, saw, rapor, dashboard, user. Layered architecture sesuai `design.md` §3 | Selesai | FR-1…FR-7 |
| H-006 | 2026-09-10 | Implementasi | Penambahan | backend | Service SAW (inti sistem) | `backend/src/services/saw.service.js` — matriks keputusan, normalisasi benefit/cost, pembobotan, nilai preferensi Vi, mapping predikat, penyimpanan hasil + `detail_normalisasi` | Selesai | FR-4, `ai.md` §3–5 |
| H-005 | 2026-09-10 | Implementasi | Penambahan | backend | Cetak rapor PDF | `backend/src/services/rapor.service.js` memakai PDFKit: identitas santri, tabel nilai per kriteria, Vi, predikat, grafik tren | Selesai | FR-7 |
| H-004 | 2026-09-10 | Implementasi | Penambahan | backend | Middleware autentikasi, RBAC, validasi & error | `auth.middleware.js` (JWT), `role.middleware.js`, `validate.middleware.js` (express-validator), `errorHandler.middleware.js` | Selesai | FR-1, NFR Keamanan |
| H-003 | 2026-09-10 | Implementasi | Penambahan | backend | Model & koneksi database | Sequelize model untuk 6 tabel + pool `mysql2` di `src/config/database.js`, konfigurasi via `.env` | Selesai | `design.md` §5 |
| H-002 | 2026-09-10 | Implementasi | Penambahan | backend | Kerangka aplikasi ExpressJS | `src/server.js`, `src/app.js`, konfigurasi env, logger, helper response, konstanta, `package.json` + `.env.example` | Selesai | — |
| H-001 | 2026-09-10 | Desain | Dokumentasi | Vault | Pembuatan `history.md` | Dibuat untuk mencatat setiap penambahan/perubahan proyek. Berisi aturan penulisan, decision log, dan log perubahan | Selesai | — |

---

## Catatan Arsitektur File

Struktur folder mengikuti kerangka awal yang sudah ada di repository (tidak diubah), sehingga riwayat commit tetap konsisten:

```
E-Rapor-TPQ-Baitur-Rouf/
├── Vault/                  # Dokumen proyek (PRD, design, ai, flow, history, pengujian)
├── backend/                # ExpressJS + MySQL
│   ├── migrations/         # Skema SQL
│   ├── seeders/            # Data contoh
│   ├── src/
│   │   ├── config/         # env, koneksi database
│   │   ├── controllers/    # HTTP request/response
│   │   ├── middlewares/    # auth, role, validasi, error
│   │   ├── models/         # Sequelize model
│   │   ├── routes/         # Definisi endpoint REST
│   │   ├── services/       # Business logic (termasuk saw.service.js)
│   │   ├── utils/          # konstanta, logger, response
│   │   └── validations/    # aturan validasi input
│   └── tests/              # unit/ dan blackbox/
└── frontend/               # ReactJS (Vite)
    └── src/
        ├── api/            # pemanggil REST API
        ├── components/     # komponen pakai ulang (grafik, rapor)
        ├── context/        # AuthContext / AuthProvider
        ├── hooks/          # useAuth, useNilai, useSAW
        ├── pages/          # admin/, ustadz/, walisantri/, auth/
        ├── routes/         # AppRoutes, PrivateRoute, RoleRoute
        ├── styles/
        └── utils/
```

---

## Kredensial Akun Demo (data uji — **jangan** dipakai di produksi)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tpqbaiturrouf.sch.id` | `admin123` |
| Ustadz | `ustadz1@tpqbaiturrouf.sch.id` | `ustadz123` |
| Ustadz | `ustadz2@tpqbaiturrouf.sch.id` | `ustadz123` |
| Wali Santri | `wali1@tpqbaiturrouf.sch.id` … `wali5@…` | `wali123` |

> Kata sandi di atas hanya untuk lingkungan pengembangan/pengujian. Ganti seluruhnya sebelum deployment (lihat `backend/.env.example`).
