import { RENTANG_PREDIKAT } from './constants';

/**
 * Memetakan nilai preferensi Vi (0-1) ke predikat.
 * Logikanya sama dengan `mapViKePredikat` di backend agar tampilan
 * frontend selalu konsisten dengan hasil perhitungan SAW.
 */
export const viKePredikat = (vi) => {
  const nilai = Number(vi);
  if (Number.isNaN(nilai)) return '-';
  const cocok = RENTANG_PREDIKAT.find((r) => nilai >= r.min);
  return (cocok || RENTANG_PREDIKAT[RENTANG_PREDIKAT.length - 1]).predikat;
};

/** Warna badge sesuai predikat. */
export const warnaPredikat = (predikat) =>
  RENTANG_PREDIKAT.find((r) => r.predikat === predikat)?.warna || '#6b7280';

/** Kelas CSS badge sesuai predikat. */
export const kelasBadgePredikat = (predikat) => {
  switch (predikat) {
    case 'Sangat Baik':
      return 'badge badge-hijau';
    case 'Baik':
      return 'badge badge-biru';
    case 'Cukup':
      return 'badge badge-kuning';
    case 'Kurang':
      return 'badge badge-merah';
    default:
      return 'badge';
  }
};

/** Keterangan rentang predikat untuk ditampilkan sebagai bantuan. */
export const teksRentangPredikat = RENTANG_PREDIKAT.map((r) =>
  r.min === 0 ? `< ${RENTANG_PREDIKAT[RENTANG_PREDIKAT.length - 2].min} ${r.predikat}` : `≥ ${r.min} ${r.predikat}`
).join('  ·  ');
