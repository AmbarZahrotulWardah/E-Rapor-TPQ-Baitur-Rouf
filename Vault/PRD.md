# Product Requirements Document (PRD)
## Sistem E-Rapor Digital Berbasis Artificial Intelligence Menggunakan Metode Simple Additive Weighting (SAW) untuk Evaluasi Perkembangan Tajwid dan Akademik Santri TPQ Baitur Rouf Surabaya

| Field         | Detail                          |
|---------------|----------------------------------|
| Versi Dokumen | 1.0                              |
| Tanggal       | 10 September 2026                |
| Status        | Draft                            |
| Pemilik Produk| Pengembang / Peneliti (Tugas Akhir/Skripsi) |
| Lokasi Studi Kasus | TPQ Baitur Rouf, Surabaya  |

---

## 1. Latar Belakang & Masalah

TPQ Baitur Rouf saat ini melakukan penilaian perkembangan santri (tajwid & akademik) secara manual, kemungkinan menggunakan catatan tertulis atau spreadsheet sederhana. Proses ini memiliki beberapa kelemahan:

- Perhitungan nilai akhir dan predikat dilakukan manual, rawan human error dan tidak konsisten antar ustadz/ustadzah.
- Wali santri tidak memiliki akses langsung untuk memantau perkembangan anaknya secara berkala (hanya menerima rapor cetak per semester).
- Tidak ada visualisasi tren perkembangan santri dari waktu ke waktu.
- Proses rekap dan pembuatan rapor memakan waktu lama menjelang akhir semester.

## 2. Tujuan Produk (Goals)

1. Mengotomasi perhitungan nilai akhir dan predikat santri menggunakan metode **SAW (Simple Additive Weighting)** agar objektif dan konsisten.
2. Menyediakan akses digital bagi wali santri untuk memantau perkembangan anak secara real-time (bukan hanya di akhir semester).
3. Mempercepat proses input nilai oleh ustadz/ustadzah dan proses cetak rapor oleh admin.
4. Menyediakan visualisasi tren perkembangan santri per periode.
5. Memvalidasi keakuratan sistem melalui pengujian black box dan perbandingan hasil manual vs sistem.

## 3. Target Pengguna (User Roles)

| Role             | Deskripsi                                                        | Kebutuhan Utama                                  |
|------------------|---------------------------------------------------------------------|----------------------------------------------------|
| **Admin**        | Pengelola TPQ (kepala TPQ/staf tata usaha)                          | Kelola user, kelas, kriteria & bobot penilaian     |
| **Ustadz/Ustadzah** | Pengajar yang menilai santri                                    | Input data santri & nilai per kriteria per pertemuan|
| **Wali Santri**  | Orang tua/wali dari santri                                          | Melihat rapor & grafik perkembangan anak           |

## 4. Ruang Lingkup (Scope)

### 4.1 In-Scope (Fitur Utama)

| No | Fitur                     | Keterangan                                              |
|----|-----------------------------|------------------------------------------------------------|
| 1  | Login sesuai peran           | Admin, ustadz/ustadzah, dan wali santri                     |
| 2  | Input data santri             | Data pribadi dan kelas santri                               |
| 3  | Input nilai per kriteria      | Nilai tajwid dan akademik tiap pertemuan                    |
| 4  | Perhitungan SAW otomatis      | Sistem menghitung nilai akhir dan predikat                  |
| 5  | Dashboard wali santri          | Melihat rapor secara langsung                               |
| 6  | Grafik perkembangan            | Menampilkan tren nilai santri per periode                   |
| 7  | Cetak rapor                    | Menghasilkan rapor dalam bentuk PDF per semester             |

### 4.2 Out-of-Scope (Tidak Termasuk Versi Ini)

- Aplikasi mobile native (Android/iOS) — hanya web responsif.
- Notifikasi otomatis via WhatsApp/SMS/email ke wali santri.
- Pembayaran/administrasi SPP santri.
- Absensi kehadiran santri (kecuali disepakati sebagai tambahan di iterasi berikutnya).
- Machine learning berbasis pengenalan suara untuk penilaian tajwid otomatis (disebut sebagai catatan pengembangan lanjutan, bukan bagian rilis awal).

## 5. Functional Requirements (Detail per Fitur)

### FR-1 Login Sesuai Peran
- Sistem menyediakan satu halaman login untuk seluruh role.
- Sistem mengautentikasi menggunakan email & password (hashed).
- Sistem mengarahkan (redirect) user ke dashboard sesuai role setelah login berhasil.
- Sistem menolak akses ke halaman/endpoint di luar kewenangan role (RBAC).

### FR-2 Input Data Santri
- Admin/Ustadz dapat menambah, mengedit, dan menghapus data santri.
- Data mencakup: NIS, nama, tempat/tanggal lahir, jenis kelamin, kelas, dan wali santri terkait.
- Sistem melakukan validasi data wajib sebelum disimpan.

### FR-3 Input Nilai per Kriteria
- Ustadz/Ustadzah dapat menginput nilai per kriteria (mis. makhraj, tajwid, kelancaran, hafalan, akademik) untuk setiap pertemuan.
- Sistem menyimpan nilai beserta periode dan tanggal pertemuan.
- Sistem memvalidasi rentang skor (0–100).

### FR-4 Perhitungan SAW Otomatis
- Sistem menghitung nilai akhir santri menggunakan metode SAW (normalisasi matriks, pembobotan, penjumlahan preferensi).
- Sistem memetakan nilai akhir ke predikat (Sangat Baik/Baik/Cukup/Kurang).
- Perhitungan dapat dijalankan otomatis per akhir periode atau dipicu manual oleh admin/ustadz.
- Bobot kriteria dapat dikonfigurasi oleh admin (total bobot harus = 1).

### FR-5 Dashboard Wali Santri
- Wali santri hanya dapat melihat data anaknya sendiri (data terisolasi per akun).
- Dashboard menampilkan nilai & predikat terbaru serta ringkasan perkembangan.

### FR-6 Grafik Perkembangan
- Sistem menampilkan grafik tren nilai santri per periode/pertemuan (line chart).
- Grafik dapat difilter per kriteria (tajwid vs akademik) atau nilai akhir gabungan.

### FR-7 Cetak Rapor
- Sistem menghasilkan rapor dalam format PDF berisi identitas santri, nilai per kriteria, nilai akhir, dan predikat per semester.
- Rapor dapat diunduh oleh admin, ustadz, maupun wali santri (sesuai hak akses).

## 6. Non-Functional Requirements

| Kategori       | Kebutuhan                                                              |
|----------------|---------------------------------------------------------------------------|
| Keamanan       | Password ter-hash (bcrypt), autentikasi JWT, RBAC ketat per endpoint       |
| Performa       | Waktu respons API rata-rata < 1 detik untuk operasi CRUD standar          |
| Usability      | Antarmuka sederhana, ramah pengguna non-teknis (ustadz/wali santri awam)  |
| Kompatibilitas | Web responsif (desktop & mobile browser)                                  |
| Maintainability| Kode backend modular (controller-service-model) agar mudah diuji & dikembangkan |
| Reliability    | Hasil perhitungan SAW harus deterministik & konsisten (tidak berubah-ubah untuk input yang sama) |

## 7. Tech Stack

| Komponen             | Teknologi                              |
|-----------------------|------------------------------------------|
| Frontend              | ReactJS                                  |
| Backend               | ExpressJS (Node.js)                      |
| Database              | MySQL                                    |
| Komunikasi Data       | RESTful API                              |
| Metode Pengembangan   | Waterfall                                |
| Metode Perhitungan    | Simple Additive Weighting (SAW)          |
| Metode Pengujian      | Black Box Testing + Perbandingan hasil manual vs sistem |

## 8. Metodologi Pengembangan (Waterfall)

| Fase                     | Deliverable                                                |
|---------------------------|--------------------------------------------------------------|
| 1. Analisis Kebutuhan       | PRD (dokumen ini), wawancara dengan pihak TPQ                |
| 2. Desain Sistem             | design.md (ERD, arsitektur, API), ai.md (algoritma SAW)      |
| 3. Implementasi              | Coding backend (Express) & frontend (React)                  |
| 4. Pengujian                 | Black box testing per fitur + perbandingan manual vs sistem  |
| 5. Deployment                | Hosting aplikasi (server/cloud) untuk digunakan TPQ           |
| 6. Pemeliharaan               | Perbaikan bug, penyesuaian bobot kriteria sesuai kebutuhan TPQ|

> Catatan: Model Waterfall dipilih karena kebutuhan sistem relatif sudah jelas dan tetap (fixed scope) sejak awal, sesuai karakteristik studi kasus TPQ dengan proses penilaian yang sudah baku.

## 9. Kriteria Keberhasilan (Success Metrics)

| Metrik                                            | Target                                     |
|-----------------------------------------------------|-----------------------------------------------|
| Akurasi perhitungan SAW vs manual                     | Selisih = 0 (deterministik, hasil identik)   |
| Kelulusan skenario black box testing                  | ≥ 95% skenario uji berhasil (pass)           |
| Waktu proses cetak rapor per santri                   | < 5 detik                                     |
| Wali santri dapat mengakses rapor tanpa bantuan admin | 100% wali santri berhasil login & lihat rapor|
| Pengurangan waktu rekap nilai manual oleh ustadz       | Berkurang signifikan dibanding proses lama    |

## 10. Asumsi

- TPQ Baitur Rouf memiliki koneksi internet yang memadai untuk mengakses aplikasi web.
- Kriteria penilaian (tajwid & akademik) sudah disepakati bersama pihak TPQ sebelum implementasi bobot SAW.
- Setiap wali santri memiliki akun email/kontak yang valid untuk didaftarkan sebagai user.
- Data historis santri (jika ada) akan dimigrasikan secara manual oleh admin ke sistem baru.

## 11. Risiko & Mitigasi

| Risiko                                              | Mitigasi                                                     |
|--------------------------------------------------------|-------------------------------------------------------------|
| Bobot kriteria SAW tidak disepakati sejak awal          | Lakukan wawancara/FGD dengan ustadz TPQ sebelum fase desain  |
| Ustadz/ustadzah kurang familiar dengan teknologi         | Sediakan panduan penggunaan (user manual) dan UI yang sederhana |
| Hasil SAW dianggap tidak sesuai ekspektasi penilaian manual | Sediakan fitur perbandingan & validasi bersama ustadz sebelum go-live |
| Keterlambatan input nilai oleh ustadz                    | Tambahkan reminder/indikator progres input nilai per kelas   |

## 12. Dependensi Antar Dokumen

- **design.md** — detail arsitektur teknis, ERD, dan struktur folder yang mengimplementasikan PRD ini.
- **flow.md** — alur proses operasional dari setiap functional requirement di atas.
- **ai.md** — justifikasi & detail teknis metode SAW yang menjadi inti FR-4.

## 13. Open Questions (Perlu Konfirmasi ke Pihak TPQ/Pembimbing)

- Apa saja kriteria final penilaian tajwid & akademik beserta bobot yang disepakati?
- Apakah rentang predikat (Sangat Baik/Baik/Cukup/Kurang) sudah sesuai standar TPQ, atau ada istilah lain yang biasa dipakai?
- Apakah wali santri didaftarkan manual oleh admin, atau perlu fitur registrasi mandiri?
- Apakah dibutuhkan multi-periode (misal per bulan) atau cukup per semester untuk hasil SAW?
