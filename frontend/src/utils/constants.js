/** Konstanta frontend — selaras dengan backend/src/utils/constants.js */

export const ROLES = {
  ADMIN: 'admin',
  USTADZ: 'ustadz',
  WALI_SANTRI: 'wali_santri',
};

export const LABEL_ROLE = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.USTADZ]: 'Ustadz/Ustadzah',
  [ROLES.WALI_SANTRI]: 'Wali Santri',
};

/** Halaman tujuan tiap role setelah login (Vault/flow.md §1). */
export const REDIRECT_PER_ROLE = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.USTADZ]: '/ustadz/dashboard',
  [ROLES.WALI_SANTRI]: '/wali/dashboard',
};

/** Rentang predikat — sama dengan backend (Vault/ai.md §3.4). */
export const RENTANG_PREDIKAT = [
  { predikat: 'Sangat Baik', min: 0.85, warna: '#1a7f37' },
  { predikat: 'Baik', min: 0.7, warna: '#0969da' },
  { predikat: 'Cukup', min: 0.55, warna: '#bf8700' },
  { predikat: 'Kurang', min: 0, warna: '#cf222e' },
];

export const SKOR_MIN = 0;
export const SKOR_MAX = 100;

/** Palet warna untuk grafik. */
export const PALET_GRAFIK = ['#1b5e20', '#0969da', '#bf8700', '#cf222e', '#6f42c1'];

export const JENIS_KELAMIN = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

export const STATUS_SANTRI = ['aktif', 'lulus', 'pindah', 'berhenti'];
