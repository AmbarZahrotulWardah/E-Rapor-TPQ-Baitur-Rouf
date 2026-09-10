/**
 * Konstanta domain aplikasi.
 * Nilai-nilai di sini adalah "aturan bisnis" yang boleh disesuaikan dengan
 * kebijakan TPQ tanpa mengubah alur program.
 */

/** Role pengguna sistem (FR-1). */
const ROLES = {
  ADMIN: 'admin',
  USTADZ: 'ustadz',
  WALI_SANTRI: 'wali_santri',
};

const ROLE_LIST = Object.values(ROLES);

/**
 * Rentang predikat hasil SAW (skala 0-1).
 * Sumber: Vault/ai.md §3.4.
 * Diurutkan dari batas bawah terbesar agar pemetaan cukup mengambil
 * entri pertama yang memenuhi `vi >= min`.
 */
const RENTANG_PREDIKAT = [
  { predikat: 'Sangat Baik', min: 0.85, warna: '#1a7f37' },
  { predikat: 'Baik', min: 0.7, warna: '#0969da' },
  { predikat: 'Cukup', min: 0.55, warna: '#bf8700' },
  { predikat: 'Kurang', min: 0, warna: '#cf222e' },
];

const PREDIKAT_LIST = RENTANG_PREDIKAT.map((item) => item.predikat);

/** Jenis kriteria SAW. */
const JENIS_KRITERIA = {
  BENEFIT: 'benefit',
  COST: 'cost',
};

/**
 * Basis normalisasi matriks keputusan.
 * - SKALA_PENUH : pembagi = nilai maksimum skala penilaian (100).
 *                 Dipakai untuk evaluasi capaian satu santri dan menjadi
 *                 basis reproduksi contoh manual pada Vault/ai.md §4.
 * - ANTAR_SANTRI: pembagi = max/min nilai antar santri pada kelas & periode
 *                 yang sama. Dipakai untuk perangkingan antar santri
 *                 (sesuai pseudocode Vault/ai.md §5).
 */
const BASIS_NORMALISASI = {
  SKALA_PENUH: 'skala_penuh',
  ANTAR_SANTRI: 'antar_santri',
};

/** Rentang skor mentah yang diterima sistem (FR-3). */
const SKOR_MIN = 0;
const SKOR_MAX = 100;

/** Skala penuh penilaian, dipakai normalisasi basis SKALA_PENUH. */
const SKALA_PENUH = 100;

/** Kriteria default bila tabel `kriteria` kosong (Vault/ai.md §2). */
const KRITERIA_DEFAULT = [
  { kode: 'C1', nama: 'Makhraj Huruf', bobot: 0.2, jenis: 'benefit' },
  { kode: 'C2', nama: 'Tajwid', bobot: 0.25, jenis: 'benefit' },
  { kode: 'C3', nama: 'Kelancaran Bacaan', bobot: 0.2, jenis: 'benefit' },
  { kode: 'C4', nama: 'Hafalan', bobot: 0.15, jenis: 'benefit' },
  { kode: 'C5', nama: 'Akademik (Tulis/Iqra)', bobot: 0.2, jenis: 'benefit' },
];

/** Arah halaman yang dituju tiap role setelah login (Vault/flow.md §1). */
const REDIRECT_PER_ROLE = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.USTADZ]: '/ustadz/dashboard',
  [ROLES.WALI_SANTRI]: '/wali/dashboard',
};

const JENIS_KELAMIN = ['L', 'P'];

module.exports = {
  ROLES,
  ROLE_LIST,
  RENTANG_PREDIKAT,
  PREDIKAT_LIST,
  JENIS_KRITERIA,
  BASIS_NORMALISASI,
  SKOR_MIN,
  SKOR_MAX,
  SKALA_PENUH,
  KRITERIA_DEFAULT,
  REDIRECT_PER_ROLE,
  JENIS_KELAMIN,
};
