# AI & Algorithm Document
## Sistem E-Rapor Digital Berbasis AI dengan Metode SAW
### TPQ Baitur Rouf Surabaya

---

## 1. Posisi "Artificial Intelligence" dalam Sistem

Dalam konteks skripsi/TA ini, "Artificial Intelligence" merujuk pada penerapan **Sistem Pendukung Keputusan (Decision Support System)** berbasis metode **Multi-Criteria Decision Making (MCDM)**, yaitu **Simple Additive Weighting (SAW)**, untuk secara otomatis:

1. Mengolah data nilai mentah (tajwid & akademik) dari banyak kriteria.
2. Melakukan normalisasi dan pembobotan otomatis.
3. Menghasilkan **nilai akhir** dan **predikat** santri tanpa perhitungan manual guru.

> Catatan akademik: SAW termasuk dalam rumpun *Intelligent Decision Support System* karena mengotomasi proses pengambilan keputusan multi-kriteria yang biasanya dilakukan manusia secara manual. Ini penting dicantumkan di BAB II/III skripsi sebagai justifikasi istilah "AI".

## 2. Kriteria Penilaian (Contoh, Dapat Disesuaikan)

| Kode | Kriteria             | Jenis    | Bobot (W) | Keterangan                         |
|------|-----------------------|----------|-----------|--------------------------------------|
| C1   | Makhraj Huruf          | Benefit  | 0.20      | Ketepatan pengucapan huruf hijaiyah  |
| C2   | Tajwid                 | Benefit  | 0.25      | Penerapan hukum bacaan tajwid        |
| C3   | Kelancaran Bacaan      | Benefit  | 0.20      | Kelancaran membaca Al-Qur'an         |
| C4   | Hafalan                | Benefit  | 0.15      | Hafalan surat/doa harian             |
| C5   | Akademik (Tulis/Iqra)  | Benefit  | 0.20      | Nilai akademik pendukung             |

**Total bobot = 1.00** (syarat mutlak metode SAW)

> Bobot bisa dikonfigurasi oleh Admin melalui tabel `kriteria` — tidak di-*hardcode* di kode program, agar fleksibel bila TPQ ingin mengubah proporsi penilaian di masa depan.

## 3. Notasi Matematis Metode SAW

### 3.1 Matriks Keputusan (X)

Untuk setiap santri *i* dan kriteria *j*:

```
X = [ x_ij ]   , i = 1..m (jumlah santri), j = 1..n (jumlah kriteria)
```

### 3.2 Normalisasi Matriks (R)

- Kriteria **Benefit** (semakin besar semakin baik — semua kriteria di atas termasuk benefit):

```
r_ij = x_ij / max(x_ij)
```

- Kriteria **Cost** (semakin kecil semakin baik — jika ada, misal "jumlah kesalahan bacaan"):

```
r_ij = min(x_ij) / x_ij
```

### 3.3 Nilai Preferensi (Vi)

```
V_i = Σ (w_j * r_ij)   untuk j = 1..n
```

`V_i` adalah nilai akhir santri ke-i, dengan rentang umumnya 0–1 (atau dikonversi ke skala 0–100).

### 3.4 Pemetaan ke Predikat

| Rentang Vi (skala 0-1) | Predikat      |
|------------------------|---------------|
| ≥ 0.85                 | Sangat Baik   |
| 0.70 – 0.84            | Baik          |
| 0.55 – 0.69            | Cukup         |
| < 0.55                 | Kurang        |

> Rentang ini contoh awal — sebaiknya divalidasi dengan pembimbing/ustadz TPQ agar sesuai standar penilaian riil.

## 4. Contoh Perhitungan Manual (Untuk Validasi Sistem)

Misal 1 santri, periode tertentu, skor mentah (0-100):

| Kriteria | Skor (x) | Bobot (w) |
|----------|----------|-----------|
| C1       | 80       | 0.20      |
| C2       | 85       | 0.25      |
| C3       | 75       | 0.20      |
| C4       | 90       | 0.15      |
| C5       | 70       | 0.20      |

Asumsi nilai maksimum tiap kriteria antar seluruh santri di kelas = 100 (skala penuh), maka normalisasi benefit:

```
r_C1 = 80/100 = 0.80
r_C2 = 85/100 = 0.85
r_C3 = 75/100 = 0.75
r_C4 = 90/100 = 0.90
r_C5 = 70/100 = 0.70
```

Nilai preferensi:

```
Vi = (0.20*0.80) + (0.25*0.85) + (0.20*0.75) + (0.15*0.90) + (0.20*0.70)
Vi = 0.16 + 0.2125 + 0.15 + 0.135 + 0.14
Vi = 0.7975
```

Predikat: **Baik** (0.70 – 0.84)

> Hasil ini yang harus **sama persis** dengan output sistem saat pengujian "perbandingan hasil manual dengan sistem".

## 5. Pseudocode Algoritma (`saw.service.js`)

```
FUNCTION hitungSAW(idKelas atau idSantriList, periode):
    kriteriaList = getKriteriaAktif()               // ambil dari tabel kriteria
    validasiTotalBobot(kriteriaList)                 // pastikan total bobot = 1

    matriksX = {}                                     // matriks keputusan
    FOR EACH santri IN santriList:
        FOR EACH kriteria IN kriteriaList:
            matriksX[santri][kriteria] = getRataRataNilai(santri, kriteria, periode)

    // Normalisasi
    matriksR = {}
    FOR EACH kriteria IN kriteriaList:
        IF kriteria.jenis == "benefit":
            maxVal = MAX(matriksX[*][kriteria])
            FOR EACH santri:
                matriksR[santri][kriteria] = matriksX[santri][kriteria] / maxVal
        ELSE IF kriteria.jenis == "cost":
            minVal = MIN(matriksX[*][kriteria])
            FOR EACH santri:
                matriksR[santri][kriteria] = minVal / matriksX[santri][kriteria]

    // Nilai preferensi
    FOR EACH santri:
        Vi = 0
        FOR EACH kriteria IN kriteriaList:
            Vi += kriteria.bobot * matriksR[santri][kriteria]
        predikat = mapVikePredikat(Vi)
        simpanHasilSAW(santri, periode, Vi, predikat)

    RETURN hasilSAWList
```

## 6. Struktur Data Input/Output Service SAW

**Input (dari tabel `nilai`, diagregasi per periode):**
```json
{
  "idSantri": 12,
  "periode": "Ganjil 2025/2026",
  "skor": {
    "C1": 80,
    "C2": 85,
    "C3": 75,
    "C4": 90,
    "C5": 70
  }
}
```

**Output (disimpan ke `hasil_saw`):**
```json
{
  "idSantri": 12,
  "periode": "Ganjil 2025/2026",
  "nilai_akhir": 0.7975,
  "predikat": "Baik",
  "detail_normalisasi": {
    "C1": 0.80, "C2": 0.85, "C3": 0.75, "C4": 0.90, "C5": 0.70
  }
}
```

> Menyimpan `detail_normalisasi` opsional tapi sangat membantu untuk transparansi rapor dan debugging saat pengujian black box.

## 7. Strategi Pengujian Algoritma

1. **Unit Test** (`tests/unit/saw.service.test.js`):
   - Uji normalisasi benefit & cost dengan data dummy.
   - Uji total bobot ≠ 1 harus menghasilkan error/validasi gagal.
   - Uji hasil Vi sesuai perhitungan matematis manual (lihat Bab 4).

2. **Perbandingan Manual vs Sistem**:
   - Ambil minimal 5–10 sampel data nilai santri riil.
   - Hitung manual di Excel/kalkulator menggunakan rumus yang sama.
   - Bandingkan hasil `Vi` dan `predikat` — toleransi selisih idealnya 0 (karena rumus deterministik, bukan machine learning probabilistik).

3. **Black Box Testing**:
   - Fokus pada input-output tanpa melihat isi kode: form input nilai, tombol hitung SAW, tampilan hasil, cetak rapor.
   - Skenario: input valid, input di luar rentang (misal skor > 100), input kosong, role yang tidak berwenang mencoba mengakses endpoint SAW.

## 8. Catatan Pengembangan Lanjutan (Opsional)

Jika ke depan ingin benar-benar menambahkan unsur *machine learning* (bukan sekadar MCDM), beberapa arah yang bisa dieksplorasi (di luar cakupan skripsi ini kecuali diminta pembimbing):
- Klasifikasi otomatis kesalahan tajwid dari rekaman suara (speech recognition + NLP Arab).
- Prediksi tren nilai santri periode berikutnya (regresi/time-series sederhana).

Untuk cakupan skripsi saat ini, **SAW sudah cukup dan valid** sebagai metode pendukung keputusan yang disebut dalam judul.
