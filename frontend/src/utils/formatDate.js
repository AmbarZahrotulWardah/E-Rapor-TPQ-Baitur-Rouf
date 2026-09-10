/** Format tanggal menjadi gaya Indonesia. */

const OPSI_TANGGAL = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' };
const OPSI_SINGKAT = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta' };

export const formatTanggal = (nilai) => {
  if (!nilai) return '-';
  const tanggal = new Date(nilai);
  if (Number.isNaN(tanggal.getTime())) return String(nilai);
  return tanggal.toLocaleDateString('id-ID', OPSI_TANGGAL);
};

export const formatTanggalSingkat = (nilai) => {
  if (!nilai) return '-';
  const tanggal = new Date(nilai);
  if (Number.isNaN(tanggal.getTime())) return String(nilai);
  return tanggal.toLocaleDateString('id-ID', OPSI_SINGKAT);
};

/** Menghitung umur dari tanggal lahir — dipakai di kartu identitas santri. */
export const hitungUmur = (tanggalLahir) => {
  if (!tanggalLahir) return '-';
  const lahir = new Date(tanggalLahir);
  if (Number.isNaN(lahir.getTime())) return '-';
  const kini = new Date();
  let umur = kini.getFullYear() - lahir.getFullYear();
  const belumUlangTahun =
    kini.getMonth() < lahir.getMonth() ||
    (kini.getMonth() === lahir.getMonth() && kini.getDate() < lahir.getDate());
  if (belumUlangTahun) umur -= 1;
  return `${umur} tahun`;
};

/** Nilai 0-1 menjadi skala 0-100 dengan dua desimal. */
export const keSkala100 = (vi) => (Number(vi) * 100).toFixed(2);
