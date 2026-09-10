# Dokumen Pengujian Sistem
## Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

| Field | Detail |
|-------|--------|
| Tanggal Pengujian | 10 September 2026 |
| Metode | Black Box Testing + Perbandingan Hasil Manual vs Sistem + Unit Test |
| Lingkungan | Node.js v20.20.2 · MariaDB 11.8.6 (kompatibel MySQL) · ExpressJS 4.21 · ReactJS 18.3 |
| Acuan | `PRD.md` §7 & §9, `ai.md` §7, `flow.md` §7 |

---

## 1. Ringkasan Hasil Pengujian

| Jenis Pengujian | Jumlah Skenario | Lulus | Gagal | Tingkat Kelulusan | Target (PRD §9) | Status |
|-----------------|-----------------|-------|-------|-------------------|-----------------|--------|
| Unit Test algoritma SAW | 17 | 17 | 0 | 100% | — | ✅ Memenuhi |
| Black Box Testing API | 54 | 54 | 0 | 100% | ≥ 95% | ✅ Memenuhi |
| Perbandingan manual vs sistem | 12 sampel | 12 | 0 | 100% | Selisih = 0 | ✅ Memenuhi |

**Perintah untuk mengulang pengujian:**

```bash
cd backend
npm run test:unit       # 17 unit test algoritma SAW
npm run test:blackbox   # 54 skenario black box (server harus berjalan)
```

---

## 2. Unit Test Algoritma SAW

Berkas: `backend/tests/unit/saw.test.js`
Semua pengujian memakai fungsi murni sehingga **tidak memerlukan database**.

| No | Skenario Uji | Hasil yang Diharapkan | Hasil |
|----|--------------|------------------------|-------|
| UT-01 | Total bobot kriteria = 1 | Dinyatakan valid, mengembalikan 1 | ✅ Lulus |
| UT-02 | Total bobot < 1 (0.5) | Melempar galat "harus sama dengan 1" | ✅ Lulus |
| UT-03 | Total bobot > 1 (1.2) | Melempar galat "harus sama dengan 1" | ✅ Lulus |
| UT-04 | Selisih kecil akibat *floating point* (0.1+0.2+0.3+0.4) | Tetap diterima (toleransi 0.001) | ✅ Lulus |
| UT-05 | Daftar kriteria kosong | Melempar galat "Daftar kriteria kosong" | ✅ Lulus |
| UT-06 | Normalisasi benefit basis skala penuh | r = x / 100 → {0.8, 0.85, 0.75, 0.9, 0.7} | ✅ Lulus |
| UT-07 | Normalisasi benefit basis antar santri | Pembagi = nilai maksimum (100) | ✅ Lulus |
| UT-08 | Normalisasi **cost** basis antar santri | Pembagi = nilai minimum (20); x=20 → r=1, x=50 → r=0.4 | ✅ Lulus |
| UT-09 | Nilai kosong (null) pada matriks | Diperlakukan sebagai 0, tidak merusak penjumlahan | ✅ Lulus |
| UT-10 | Contoh manual `ai.md` §4 | Vi = **0.7975**, predikat **Baik** | ✅ Lulus |
| UT-11 | Kontribusi tiap kriteria dapat ditelusuri | C1=0.16, C2=0.2125, C3=0.15, C4=0.135, C5=0.14 | ✅ Lulus |
| UT-12 | Pemetaan Vi ke predikat (8 titik batas) | Batas bawah inklusif, sesuai `ai.md` §3.4 | ✅ Lulus |
| UT-13 | Determinisme hasil | Dua kali perhitungan menghasilkan output identik | ✅ Lulus |
| UT-14 | Santri bernilai lebih tinggi | Memperoleh Vi lebih besar | ✅ Lulus |
| UT-15 | Peringkat untuk nilai seri | Pola kompetisi 1, 2, 2, 4 | ✅ Lulus |
| UT-16 | Santri tanpa nilai | Dilaporkan terpisah, tidak dihitung | ✅ Lulus |
| UT-17 | Tidak ada data nilai sama sekali | Melempar galat "Belum ada data nilai" | ✅ Lulus |

---

## 3. Black Box Testing

Berkas: `backend/tests/blackbox/api.test.js`
Pengujian dilakukan terhadap **API yang berjalan sungguhan** dengan database MySQL. Hanya input (permintaan HTTP) dan output (kode status + isi respons) yang diperiksa.

### 3.1 FR-1 Login Sesuai Peran

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-01 | Login admin dengan kredensial benar | email + password valid | 200, menerima token JWT | 200, token diterima | ✅ |
| BB-02 | Redirect sesuai role | Login 3 role berbeda | `/admin/dashboard`, `/ustadz/dashboard`, `/wali/dashboard` | Sesuai | ✅ |
| BB-03 | Password salah | password tidak cocok | 401, `success: false` | 401 | ✅ |
| BB-04 | Email tidak terdaftar | email acak | 401 | 401 | ✅ |
| BB-05 | Email kosong | `email: ""` | 422 + rincian galat | 422 | ✅ |
| BB-06 | Format email tidak valid | `bukan-email` | 422 | 422 | ✅ |
| BB-07 | Akses tanpa token | tanpa header Authorization | 401 | 401 | ✅ |
| BB-08 | Token tidak valid | `token.palsu.xyz` | 401 | 401 | ✅ |
| BB-09 | Wali membuka menu admin | token wali → `GET /users` | 403 | 403 | ✅ |
| BB-10 | Ustadz membuat akun | token ustadz → `POST /users` | 403 | 403 | ✅ |

### 3.2 FR-2 Input Data Santri

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-11 | Tambah santri data lengkap | NIS, nama, TTL, JK, kelas, wali | 201, data tersimpan | 201 | ✅ |
| BB-12 | NIS duplikat | NIS yang sudah ada | 409 | 409 | ✅ |
| BB-13 | NIS & nama kosong | string kosong | 422 | 422 | ✅ |
| BB-14 | Jenis kelamin di luar L/P | `jenis_kelamin: "Z"` | 422 | 422 | ✅ |
| BB-15 | Wali bukan role `wali_santri` | `id_wali` menunjuk akun admin | 422 | 422 | ✅ |
| BB-16 | Ubah data santri | nama baru | 200, nama berubah | 200 | ✅ |
| BB-17 | Pencarian berdasarkan nama | `?cari=Uji Coba` | 200, hasil ≥ 1 | 200 | ✅ |
| BB-18 | Detail santri tidak ada | ID 999999 | 404 | 404 | ✅ |
| BB-19 | Wali menambah santri | token wali | 403 | 403 | ✅ |
| BB-20 | Hapus santri | ID valid | 200 | 200 | ✅ |

### 3.3 FR-3 Input Nilai per Kriteria

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-21 | Input nilai valid | skor 88 | 201 | 201 | ✅ |
| BB-22 | Skor di atas rentang | skor 150 | 422 | 422 | ✅ |
| BB-23 | Skor negatif | skor -5 | 422 | 422 | ✅ |
| BB-24 | Skor kosong | `skor: ""` | 422 | 422 | ✅ |
| BB-25 | Kriteria tidak dikenal | `id_kriteria: 9999` | 404 | 404 | ✅ |
| BB-26 | Wali menginput nilai | token wali | 403 | 403 | ✅ |
| BB-27 | Input nilai massal (batch) | 2 kriteria sekaligus | 201, jumlah = 2 | 201 | ✅ |
| BB-28 | Ubah nilai | skor 91 | 200, skor = 91 | 200 | ✅ |
| BB-29 | Hapus nilai | ID valid | 200 | 200 | ✅ |

### 3.4 FR-4 Perhitungan SAW Otomatis

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-30 | Validasi total bobot | `GET /saw/kriteria` | `valid: true`, total 1 | Sesuai | ✅ |
| BB-31 | Hasil sama dengan manual | santri 1, periode berjalan | Vi = 0.7975, predikat Baik | 0.7975 / Baik | ✅ |
| BB-32 | Rumus normalisasi benefit | r = x / 100 | {0.8, 0.85, 0.75, 0.9, 0.7} | Sesuai | ✅ |
| BB-33 | Determinisme | dua kali pemanggilan | Nilai identik | Identik | ✅ |
| BB-34 | Tanpa parameter periode | tanpa `?periode` | 422 | 422 | ✅ |
| BB-35 | Periode tanpa data nilai | periode kosong | 422 | 422 | ✅ |
| BB-36 | Perhitungan per kelas | `hitung-kelas/1` | ≥ 2 santri + ranking | Sesuai | ✅ |
| BB-37 | Wali memicu perhitungan | token wali | 403 | 403 | ✅ |

### 3.5 FR-5 Dashboard Wali Santri

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-38 | Daftar anak sendiri | `GET /dashboard/wali/saya` | 200, ≥ 1 anak | 200, 3 anak | ✅ |
| BB-39 | Isi dashboard lengkap | `GET /dashboard/wali/1` | nilai, predikat, data grafik | Lengkap | ✅ |
| BB-40 | **Isolasi data** — anak orang lain | wali1 → santri 2 | 403 | 403 | ✅ |
| BB-41 | Wali kedua buka anak sendiri | wali2 → santri 2 | 200 | 200 | ✅ |
| BB-42 | Dashboard admin | `GET /dashboard/admin` | ringkasan + distribusi predikat | Sesuai | ✅ |
| BB-43 | Dashboard ustadz | `GET /dashboard/ustadz` | daftar kelas diampu | Sesuai | ✅ |

### 3.6 FR-6 Grafik Perkembangan

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-44 | Tren per pertemuan tersedia | wali → anaknya | 200, ada titik data | 200 | ✅ |
| BB-45 | Filter kelompok akademik | `?jenis=akademik` | hanya kriteria akademik | Hanya C5 | ✅ |
| BB-46 | **Isolasi data grafik** | wali1 → santri 2 | 403 | 403 | ✅ |

### 3.7 FR-7 Cetak Rapor PDF

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-47 | Unduh PDF rapor anak | wali → anaknya | 200, `application/pdf`, diawali `%PDF-` | Sesuai, 2 halaman | ✅ |
| BB-48 | **Isolasi data rapor** | wali1 → santri 2 | 403 | 403 | ✅ |
| BB-49 | Cetak tanpa periode | tanpa `?periode` | 422 | 422 | ✅ |
| BB-50 | Pratinjau JSON rapor | `GET /rapor/1/data` | Vi 0.7975, 5 kriteria | Sesuai | ✅ |

### 3.8 Keamanan & Penanganan Galat

| Kode | Skenario Uji | Input | Hasil Diharapkan | Hasil Aktual | Status |
|------|--------------|-------|------------------|--------------|--------|
| BB-51 | Endpoint tidak dikenal | `/tidak-ada-endpoint-ini` | 404 | 404 | ✅ |
| BB-52 | Body JSON rusak | `{ json rusak` | 400 | 400 | ✅ |
| BB-53 | Password tidak bocor | `GET /users` | tidak ada field `password` | Tidak ada | ✅ |
| BB-54 | Perubahan bobot tervalidasi | bobot C1 → 0.35 lalu dikembalikan | total 1.15 ditolak, 1.00 diterima | Sesuai | ✅ |

---

## 4. Perbandingan Hasil Perhitungan Manual vs Sistem

### 4.1 Metode Perbandingan

1. Data nilai diambil dari tabel `nilai` (12 santri × 5 kriteria × 4 pertemuan = 240 data nilai).
2. Nilai mentah tiap santri per kriteria dihitung sebagai **rata-rata seluruh pertemuan**.
3. Perhitungan manual memakai rumus SAW yang ditulis **secara terpisah** dari kode aplikasi:
   `Vi = Σ (Wj × (Xij / 100))` dengan W = {C1: 0.20, C2: 0.25, C3: 0.20, C4: 0.15, C5: 0.20}
4. Hasil manual dibandingkan dengan kolom `hasil_saw.nilai_akhir` yang dihasilkan sistem.

### 4.2 Contoh Perhitungan Rinci (Santri NIS 2025001)

| Kriteria | Skor (X) | Bobot (W) | Normalisasi R = X/100 | Kontribusi W × R |
|----------|----------|-----------|------------------------|-------------------|
| C1 Makhraj Huruf | 80 | 0.20 | 0.80 | 0.1600 |
| C2 Tajwid | 85 | 0.25 | 0.85 | 0.2125 |
| C3 Kelancaran Bacaan | 75 | 0.20 | 0.75 | 0.1500 |
| C4 Hafalan | 90 | 0.15 | 0.90 | 0.1350 |
| C5 Akademik | 70 | 0.20 | 0.70 | 0.1400 |
| **Total** | — | **1.00** | — | **Vi = 0.7975** |

Predikat: **Baik** (rentang 0.70 – 0.84) — sesuai `ai.md` §3.4.

### 4.3 Hasil Perbandingan Seluruh Sampel

| NIS | Nama Santri | Vi Manual | Vi Sistem | Selisih | Predikat Manual | Predikat Sistem | Status |
|-----|-------------|-----------|-----------|---------|-----------------|-----------------|--------|
| 2025001 | Muhammad Faiz Ramadhan | 0.7975 | 0.7975 | 0.000000 | Baik | Baik | ✅ |
| 2025002 | Aisyah Putri Handayani | 0.8880 | 0.8880 | 0.000000 | Sangat Baik | Sangat Baik | ✅ |
| 2025003 | Ahmad Zaki Mubarok | 0.6860 | 0.6860 | 0.000000 | Cukup | Cukup | ✅ |
| 2025004 | Khadijah Nur Aini | 0.8950 | 0.8950 | 0.000000 | Sangat Baik | Sangat Baik | ✅ |
| 2025005 | Umar Faruq Alfarizi | 0.7780 | 0.7780 | 0.000000 | Baik | Baik | ✅ |
| 2025006 | Zahra Amelia Sari | 0.6140 | 0.6140 | 0.000000 | Cukup | Cukup | ✅ |
| 2025007 | Bilal Hafidz Maulana | 0.9180 | 0.9180 | 0.000000 | Sangat Baik | Sangat Baik | ✅ |
| 2025008 | Maryam Shafira Azzahra | 0.7135 | 0.7135 | 0.000000 | Baik | Baik | ✅ |
| 2025009 | Abdullah Azzam Pratama | 0.8250 | 0.8250 | 0.000000 | Baik | Baik | ✅ |
| 2025010 | Salma Nadia Rahmadani | 0.5140 | 0.5140 | 0.000000 | Kurang | Kurang | ✅ |
| 2025011 | Yusuf Ibrahim Hakim | 0.9185 | 0.9185 | 0.000000 | Sangat Baik | Sangat Baik | ✅ |
| 2025012 | Hanifah Salsabila Putri | 0.6790 | 0.6790 | 0.000000 | Cukup | Cukup | ✅ |

**Selisih maksimum: 0.000000** · **12 dari 12 sampel identik** · Predikat seluruhnya cocok.

Hasil ini memenuhi kriteria keberhasilan PRD §9: *"Akurasi perhitungan SAW vs manual — selisih = 0 (deterministik, hasil identik)"*.

---

## 5. Temuan dan Perbaikan Selama Pengujian

| No | Temuan | Dampak | Perbaikan | Berkas |
|----|--------|--------|-----------|--------|
| T-1 | `await ambilRataRataPeriode(...)[id]` selalu menghasilkan `undefined` karena pengindeksan dievaluasi terhadap Promise sebelum `await` | Rapor PDF & JSON selalu gagal (422) meski data nilai ada | Hasil `await` dipisahkan ke variabel sebelum diindeks | `src/services/rapor.service.js` |
| T-2 | Seeder menautkan `id_wali` 1–5, padahal akun wali ber-ID 4–8 | Wali santri tidak dapat membuka rapor anaknya (403) | `id_wali` dipetakan dari ID akun wali yang sesungguhnya | `seeders/001-seed-demo.js` |
| T-3 | `TRUNCATE` ditolak MySQL pada tabel yang dirujuk *foreign key* | Seeder gagal dijalankan | Diganti `DELETE` + reset `AUTO_INCREMENT` | `seeders/001-seed-demo.js` |
| T-4 | **Kebocoran data**: wali santri dapat membuka grafik perkembangan anak lain (BB-46 mengembalikan 200) | Data penilaian santri lain dapat diakses pihak yang tidak berwenang | Middleware `pastikanMilikWali` dipasang seragam pada endpoint grafik, dashboard, dan rapor | `src/middlewares/ownership.middleware.js` |

> Temuan T-4 terdeteksi oleh skenario black box BB-46 dan menjadi bukti bahwa pengujian hak akses per role berhasil menemukan cacat yang tidak terlihat dari pengujian alur normal.

---

## 6. Pengujian Non-Fungsional

| Aspek | Kebutuhan (PRD §6) | Cara Verifikasi | Hasil |
|-------|--------------------|-----------------|-------|
| Performa | Respons API < 1 detik untuk CRUD | Log waktu respons Morgan | Rata-rata 2–15 ms, maksimum ±112 ms (login pertama, termasuk hashing bcrypt) |
| Cetak rapor | < 5 detik per santri | Pengukuran `GET /rapor/:id/pdf` | ±40 ms (PDF 2 halaman, ~5.6 KB) |
| Keamanan | Password ter-hash bcrypt | Inspeksi kolom `users.password` | Hash bcrypt; field tidak pernah dikembalikan API (BB-53) |
| Keamanan | Autentikasi JWT + RBAC | BB-07 s.d. BB-10, BB-26, BB-37 | Seluruh akses di luar kewenangan ditolak |
| Reliability | Hasil SAW deterministik | UT-13 dan BB-33 | Identik untuk input yang sama |
| Maintainability | Pola controller-service-model | Struktur `backend/src` | Terpenuhi; service SAW dapat diuji tanpa database |
| Kompatibilitas | Web responsif | CSS *media query* 980px & 760px | Sidebar berubah menjadi menu atas pada layar kecil |

---

## 7. Kesimpulan

Seluruh kriteria keberhasilan pada `PRD.md` §9 terpenuhi:

| Metrik | Target | Hasil Aktual | Status |
|--------|--------|--------------|--------|
| Akurasi SAW vs manual | Selisih = 0 | Selisih 0.000000 pada 12 sampel | ✅ |
| Kelulusan black box | ≥ 95% | 100% (54/54) | ✅ |
| Waktu cetak rapor | < 5 detik | ±40 ms | ✅ |
| Wali santri akses rapor mandiri | 100% | Seluruh akun wali uji berhasil login & membuka rapor anaknya | ✅ |

Sistem dinyatakan **layak dilanjutkan ke fase Deployment** (Waterfall fase 5).
