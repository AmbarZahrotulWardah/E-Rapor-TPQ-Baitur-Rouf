const { fn, col, literal } = require('sequelize');
const { Nilai, Santri, Kriteria, Kelas } = require('../models');

const httpError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

/** FR-3 — simpan nilai per kriteria per pertemuan. */
const buatNilai = async (data, idUstadz) => {
  const santri = await Santri.findByPk(data.id_santri);
  if (!santri) throw httpError('Santri tidak ditemukan.', 404);

  const kriteria = await Kriteria.findByPk(data.id_kriteria);
  if (!kriteria) throw httpError('Kriteria tidak ditemukan.', 404);
  if (!kriteria.aktif) throw httpError(`Kriteria "${kriteria.nama}" sedang tidak aktif.`, 422);

  const [record, dibuat] = await Nilai.findOrCreate({
    where: {
      id_santri: data.id_santri,
      id_kriteria: data.id_kriteria,
      periode: data.periode,
      pertemuan_ke: data.pertemuan_ke,
    },
    defaults: { ...data, id_ustadz: idUstadz },
  });

  if (!dibuat) {
    record.set({ ...data, id_ustadz: idUstadz });
    await record.save();
  }

  return { nilai: record, diperbarui: !dibuat };
};

/** Input nilai massal: satu santri, satu pertemuan, banyak kriteria sekaligus. */
const buatNilaiBatch = async ({ id_santri, pertemuan_ke, periode, tanggal, nilai, catatan }, idUstadz) => {
  const hasil = [];
  for (const item of nilai) {
    // eslint-disable-next-line no-await-in-loop
    const r = await buatNilai(
      { id_santri, id_kriteria: item.id_kriteria, skor: item.skor, pertemuan_ke, periode, tanggal, catatan },
      idUstadz
    );
    hasil.push(r);
  }
  return { jumlah: hasil.length, periode, pertemuanKe: pertemuan_ke, data: hasil };
};

const ubahNilai = async (id, data) => {
  const record = await Nilai.findByPk(id);
  if (!record) throw httpError('Nilai tidak ditemukan.', 404);
  record.set(data);
  await record.save();
  return record;
};

const hapusNilai = async (id) => {
  const record = await Nilai.findByPk(id);
  if (!record) throw httpError('Nilai tidak ditemukan.', 404);
  await record.destroy();
  return { id };
};

const daftarNilai = async (filter = {}) => {
  const where = {};
  if (filter.id_santri) where.id_santri = filter.id_santri;
  if (filter.periode) where.periode = filter.periode;
  if (filter.id_kelas) where.id_santri = (await santriIdsKelas(filter.id_kelas)).ids;
  if (filter.id_kriteria) where.id_kriteria = filter.id_kriteria;

  const include = [
    { model: Santri, as: 'santri', attributes: ['id', 'nis', 'nama', 'id_kelas'] },
    { model: Kriteria, as: 'kriteria', attributes: ['id', 'kode', 'nama', 'kelompok'] },
  ];
  return Nilai.findAll({ where, include, order: [['tanggal', 'ASC'], ['pertemuan_ke', 'ASC']] });
};

const santriIdsKelas = async (idKelas) => {
  const rows = await Santri.findAll({ where: { id_kelas: idKelas }, attributes: ['id'] });
  return { ids: rows.map((r) => r.id) };
};

/**
 * Agregasi bahan baku SAW: rata-rata skor tiap santri per kriteria pada
 * satu periode (Decision Log D-6, pseudocode ai.md §5 `getRataRataNilai`).
 * @returns {Promise<{ [idSantri]: { [kodeKriteria]: number } }>}
 */
const ambilRataRataPeriode = async ({ idSantriList, periode }) => {
  if (!idSantriList || idSantriList.length === 0) return {};

  const rows = await Nilai.findAll({
    attributes: [
      'id_santri',
      [col('kriteria.kode'), 'kode'],
      [fn('AVG', col('Nilai.skor')), 'rataRata'],
      [fn('COUNT', col('Nilai.id')), 'jumlahPertemuan'],
    ],
    include: [{ model: Kriteria, as: 'kriteria', attributes: [] }],
    where: { id_santri: idSantriList, periode },
    group: ['id_santri', 'kriteria.kode'],
    raw: true,
  });

  const matriks = {};
  rows.forEach((row) => {
    const id = row.id_santri;
    if (!matriks[id]) matriks[id] = {};
    matriks[id][row.kode] = Number(Number(row.rataRata).toFixed(2));
  });
  return matriks;
};

/**
 * Data untuk grafik perkembangan (FR-6).
 * Mengembalikan rata-rata skor per kriteria untuk tiap pertemuan, berurutan.
 */
const ambilTrenPerkembangan = async ({ idSantri, periode }) => {
  const where = { id_santri: idSantri };
  if (periode) where.periode = periode;

  const rows = await Nilai.findAll({
    attributes: [
      'pertemuan_ke',
      'periode',
      'tanggal',
      [col('kriteria.kode'), 'kode'],
      [col('kriteria.nama'), 'namaKriteria'],
      [col('kriteria.kelompok'), 'kelompok'],
      [fn('AVG', col('Nilai.skor')), 'rataRata'],
    ],
    include: [{ model: Kriteria, as: 'kriteria', attributes: [] }],
    where,
    group: ['pertemuan_ke', 'periode', 'tanggal', 'kriteria.kode', 'kriteria.nama', 'kriteria.kelompok'],
    order: [[literal('tanggal'), 'ASC'], ['pertemuan_ke', 'ASC']],
    raw: true,
  });

  return rows.map((r) => ({
    pertemuanKe: r.pertemuan_ke,
    periode: r.periode,
    tanggal: r.tanggal,
    kode: r.kode,
    namaKriteria: r.namaKriteria,
    kelompok: r.kelompok,
    skor: Number(Number(r.rataRata).toFixed(2)),
  }));
};

/** Daftar periode yang punya data nilai — dipakai mengisi dropdown filter. */
const daftarPeriode = async (idKelas = null) => {
  const where = {};
  if (idKelas) where.id_santri = (await santriIdsKelas(idKelas)).ids;
  const rows = await Nilai.findAll({
    attributes: [[fn('DISTINCT', col('periode')), 'periode'], [fn('COUNT', col('id')), 'jumlah']],
    where,
    group: ['periode'],
    order: [['periode', 'DESC']],
    raw: true,
  });
  return rows.map((r) => ({ periode: r.periode, jumlahNilai: Number(r.jumlah) }));
};

module.exports = {
  buatNilai,
  buatNilaiBatch,
  ubahNilai,
  hapusNilai,
  daftarNilai,
  ambilRataRataPeriode,
  ambilTrenPerkembangan,
  daftarPeriode,
  santriIdsKelas,
};
