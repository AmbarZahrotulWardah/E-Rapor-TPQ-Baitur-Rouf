# Flow Document
## Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

---

## 1. Alur Autentikasi & Otorisasi

```
[User buka web] 
      │
      ▼
[Halaman Login] --(email + password)--> [POST /api/v1/auth/login]
      │
      ▼
[Backend verifikasi user & password]
      │
   ┌──┴───┐
 Gagal   Berhasil
   │        │
   ▼        ▼
[Tampilkan  [Generate JWT + role]
 error]        │
               ▼
        [Redirect sesuai role]
         ├── admin       -> /admin/dashboard
         ├── ustadz      -> /ustadz/dashboard
         └── wali_santri -> /wali/dashboard
```

## 2. Alur Input Data Santri (Admin/Ustadz)

```
[Ustadz/Admin login] 
      │
      ▼
[Buka menu "Data Santri"]
      │
      ▼
[Klik "Tambah Santri"]
      │
      ▼
[Isi form: NIS, Nama, TTL, Jenis Kelamin, Kelas, Wali]
      │
      ▼
[Submit -> POST /api/v1/santri]
      │
      ▼
[Backend validasi data]
   ┌──┴───┐
 Gagal   Berhasil
   │        │
   ▼        ▼
[Error    [Simpan ke tabel `santri`]
 muncul]      │
              ▼
       [Data tampil di tabel santri]
```

## 3. Alur Input Nilai per Kriteria per Pertemuan

```
[Ustadz login] 
      │
      ▼
[Pilih Kelas -> Pilih Santri]
      │
      ▼
[Buka form "Input Nilai"]
      │
      ▼
[Pilih Kriteria: Tajwid / Makhraj / Kelancaran / Akademik, dst]
      │
      ▼
[Isi skor (0-100) per kriteria + pertemuan ke- + periode]
      │
      ▼
[Submit -> POST /api/v1/nilai]
      │
      ▼
[Backend simpan ke tabel `nilai`]
      │
      ▼
[Notifikasi sukses] --> [Data siap dipakai perhitungan SAW]
```

## 4. Alur Perhitungan SAW (Inti Sistem)

```
[Trigger perhitungan]
  (otomatis per akhir periode ATAU manual oleh admin/ustadz)
      │
      ▼
[GET/POST /api/v1/saw/hitung/:idSantri atau /periode/:periode]
      │
      ▼
[Service saw.service.js dijalankan]
      │
      ▼
Step 1: Ambil semua nilai santri per kriteria pada periode terkait
      │
      ▼
Step 2: Bentuk Matriks Keputusan (X)
      │
      ▼
Step 3: Normalisasi matriks (R)
        - Jika kriteria BENEFIT: r_ij = x_ij / max(x_ij)
        - Jika kriteria COST:    r_ij = min(x_ij) / x_ij
      │
      ▼
Step 4: Kalikan hasil normalisasi dengan bobot kriteria (W)
      │
      ▼
Step 5: Jumlahkan menjadi Nilai Preferensi (Vi)
        Vi = Σ (Wj * Rij)
      │
      ▼
Step 6: Mapping Vi ke Predikat
        (mis. >0.85 Sangat Baik, 0.70-0.85 Baik, dst)
      │
      ▼
Step 7: Simpan hasil ke tabel `hasil_saw`
      │
      ▼
[Hasil siap ditampilkan di dashboard & rapor]
```

## 5. Alur Dashboard & Grafik Wali Santri

```
[Wali Santri login]
      │
      ▼
[Sistem otomatis filter data hanya untuk anaknya (id_wali)]
      │
      ▼
[GET /api/v1/dashboard/wali/:idSantri]
      │
      ▼
[Backend ambil: data santri, hasil_saw per periode, riwayat nilai]
      │
      ▼
[Frontend render]
   ├── Kartu ringkasan nilai & predikat terakhir
   ├── Grafik tren (line chart) nilai per periode/pertemuan
   └── Tombol "Lihat Rapor" / "Unduh PDF"
```

## 6. Alur Cetak Rapor PDF

```
[User (wali/ustadz/admin) klik "Cetak Rapor"]
      │
      ▼
[GET /api/v1/rapor/:idSantri/pdf?periode=xxx]
      │
      ▼
[Backend: rapor.service.js]
      │
      ▼
Step 1: Ambil data santri, nilai per kriteria, hasil SAW & predikat
      │
      ▼
Step 2: Generate layout rapor (HTML template -> PDF via Puppeteer/PDFKit)
      │
      ▼
Step 3: Kirim file PDF sebagai response (stream/download)
      │
      ▼
[Browser otomatis unduh/preview file rapor.pdf]
```

## 7. Alur Pengujian Sistem (Black Box + Perbandingan Manual)

```
[Siapkan data uji: nilai santri contoh]
      │
      ▼
[Hitung manual dengan rumus SAW (Excel/manual)]
      │
      ▼
[Input data yang sama ke sistem]
      │
      ▼
[Sistem hitung otomatis via saw.service.js]
      │
      ▼
[Bandingkan hasil akhir (Vi) & predikat: manual vs sistem]
      │
   ┌──┴───┐
 Sama    Beda
   │        │
   ▼        ▼
[Valid]  [Debug service SAW, cek bobot/normalisasi, ulangi]

Paralel: Black Box Testing per fitur
   - Test input valid/invalid pada tiap form
   - Test hak akses tiap role (tidak bisa akses di luar izin)
   - Test tombol cetak PDF menghasilkan file yang benar
   - Test grafik menampilkan data sesuai database
```

## 8. Ringkasan Alur Keseluruhan Sistem

```
Login -> Input Data Santri -> Input Nilai per Kriteria
   -> Perhitungan SAW Otomatis -> Simpan Hasil & Predikat
   -> Dashboard & Grafik Wali Santri -> Cetak Rapor PDF
   -> Pengujian (Black Box + Perbandingan Manual)
```
