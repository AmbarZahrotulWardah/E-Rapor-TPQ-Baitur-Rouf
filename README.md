# Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

Aplikasi web untuk mengevaluasi perkembangan **tajwid** dan **akademik** santri. Nilai akhir dan predikat dihitung otomatis menggunakan metode **Simple Additive Weighting (SAW)**, sehingga penilaian menjadi objektif dan konsisten.

| | |
|---|---|
| Backend | ExpressJS (Node.js) + MySQL |
| Frontend | ReactJS (Vite) |
| API | RESTful, prefix `/api/v1` |
| Autentikasi | JWT + RBAC 3 role |
| Metode Perhitungan | Simple Additive Weighting (SAW) |
| Metode Pengembangan | Waterfall |
| Metode Pengujian | Black Box Testing + Perbandingan hasil manual vs sistem |

---

## Struktur Proyek

```
E-Rapor-TPQ-Baitur-Rouf/
├── Vault/          # Dokumen proyek
│   ├── PRD.md          Kebutuhan produk
│   ├── design.md       Arsitektur, ERD, desain API
│   ├── ai.md           Detail metode SAW + contoh perhitungan manual
│   ├── flow.md         Alur proses setiap fitur
│   ├── history.md      Catatan setiap penambahan/perubahan
│   └── pengujian.md    Hasil black box testing & perbandingan manual vs sistem
├── backend/        # REST API ExpressJS + MySQL
└── frontend/       # Antarmuka ReactJS
```

---

## Menjalankan Aplikasi

### 1. Persiapan Database

Buat database dan pengguna MySQL:

```sql
CREATE DATABASE e_rapor_tpq DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # sesuaikan DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run db:migrate         # membuat 6 tabel + data kriteria awal
npm run db:seed            # mengisi data contoh (opsional, untuk pengembangan)
npm start                  # http://localhost:5000
```

### 3. Frontend

Buka terminal kedua:

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Buka `http://localhost:5173` di browser.

---

## Akun Contoh (Data Uji)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tpqbaiturrouf.sch.id` | `admin123` |
| Ustadz | `ustadz1@tpqbaiturrouf.sch.id` | `ustadz123` |
| Wali Santri | `wali1@tpqbaiturrouf.sch.id` | `wali123` |

> Kata sandi di atas hanya untuk lingkungan pengembangan. Ganti seluruhnya sebelum deployment.

---

## Fitur Utama

| No | Fitur | Role |
|----|-------|------|
| FR-1 | Login sesuai peran dengan JWT dan RBAC | Semua |
| FR-2 | Kelola data santri (NIS, identitas, kelas, wali) | Admin, Ustadz |
| FR-3 | Input nilai per kriteria per pertemuan (skor 0–100) | Ustadz |
| FR-4 | Perhitungan SAW otomatis + predikat + peringkat | Admin, Ustadz |
| FR-5 | Dashboard wali santri (terisolasi per akun) | Wali Santri |
| FR-6 | Grafik perkembangan per periode/pertemuan | Semua |
| FR-7 | Cetak dan unduh rapor PDF | Semua |

### Kriteria Penilaian Default

| Kode | Kriteria | Kelompok | Bobot |
|------|----------|----------|-------|
| C1 | Makhraj Huruf | Tajwid | 0.20 |
| C2 | Tajwid | Tajwid | 0.25 |
| C3 | Kelancaran Bacaan | Tajwid | 0.20 |
| C4 | Hafalan | Tajwid | 0.15 |
| C5 | Akademik (Tulis/Iqra) | Akademik | 0.20 |
| | **Total** | | **1.00** |

Bobot dapat diubah Admin melalui menu **Kriteria & Bobot SAW** tanpa mengubah kode program.

---

## Pengujian

```bash
cd backend
npm run test:unit         # 17 unit test algoritma SAW
npm run test:blackbox     # 54 skenario black box (server harus berjalan)
```

| Jenis | Skenario | Lulus | Hasil |
|-------|----------|-------|-------|
| Unit test SAW | 17 | 17 | 100% |
| Black box testing | 54 | 54 | 100% |
| Perbandingan manual vs sistem | 12 sampel | 12 | Selisih 0.000000 |

Rincian lengkap tersedia di [`Vault/pengujian.md`](Vault/pengujian.md).

---

## Progres Pengembangan (Waterfall)

| Fase | Deliverable | Status |
|------|-------------|--------|
| 1. Analisis Kebutuhan | `Vault/PRD.md` | ✅ Selesai |
| 2. Desain Sistem | `Vault/design.md`, `ai.md`, `flow.md` | ✅ Selesai |
| 3. Implementasi | `backend/`, `frontend/` | ✅ Selesai |
| 4. Pengujian | Unit test, black box, perbandingan manual | ✅ Selesai |
| 5. Deployment | Hosting aplikasi | 🟡 Menunggu server |
| 6. Pemeliharaan | Perbaikan bug & penyesuaian bobot | ⏳ Belum dimulai |

Catatan setiap perubahan ada di [`Vault/history.md`](Vault/history.md).
