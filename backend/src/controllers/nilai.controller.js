const nilaiService = require('../services/nilai.service');
const { Nilai, Kriteria } = require('../models');
const { success, created, fail } = require('../utils/response');

/** GET /api/v1/nilai — daftar nilai (Admin & Ustadz) */
const daftar = async (req, res, next) => {
  try {
    const rows = await nilaiService.daftarNilai({
      id_santri: req.query.id_santri,
      periode: req.query.periode,
      id_kelas: req.query.id_kelas,
      id_kriteria: req.query.id_kriteria,
    });
    return success(res, { data: rows, meta: { total: rows.length } });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/nilai — FR-3 */
const tambah = async (req, res, next) => {
  try {
    const hasil = await nilaiService.buatNilai(req.body, req.user.id);
    return created(res, {
      message: hasil.diperbarui
        ? 'Nilai berhasil diperbarui (data periode & pertemuan yang sama sudah ada).'
        : 'Nilai berhasil disimpan.',
      data: hasil.nilai,
    });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/nilai/batch — input banyak kriteria sekaligus dalam satu pertemuan */
const tambahBatch = async (req, res, next) => {
  try {
    const hasil = await nilaiService.buatNilaiBatch(req.body, req.user.id);
    return created(res, {
      message: `${hasil.jumlah} nilai berhasil disimpan untuk pertemuan ke-${hasil.pertemuanKe}.`,
      data: hasil,
    });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/nilai/:id */
const ubah = async (req, res, next) => {
  try {
    const row = await nilaiService.ubahNilai(req.params.id, req.body);
    return success(res, { message: 'Nilai berhasil diperbarui.', data: row });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/nilai/:id */
const hapus = async (req, res, next) => {
  try {
    const hasil = await nilaiService.hapusNilai(req.params.id);
    return success(res, { message: 'Nilai berhasil dihapus.', data: hasil });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/nilai/perkembangan/:idSantri — data grafik (FR-6) */
const perkembangan = async (req, res, next) => {
  try {
    const grafikService = require('../services/grafik.service');
    const data = await grafikService.dataPerkembanganSantri({
      idSantri: req.params.idSantri,
      periode: req.query.periode || null,
      jenis: req.query.jenis || 'semua',
    });
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/nilai/periode — daftar periode yang memiliki data */
const daftarPeriode = async (req, res, next) => {
  try {
    const data = await nilaiService.daftarPeriode(req.query.id_kelas || null);
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/nilai/kriteria — daftar kriteria penilaian */
const daftarKriteria = async (req, res, next) => {
  try {
    const rows = await Kriteria.findAll({
      where: req.query.semua === 'true' ? {} : { aktif: true },
      order: [['urutan', 'ASC'], ['kode', 'ASC']],
    });
    const totalBobot = rows
      .filter((r) => r.aktif)
      .reduce((a, r) => a + Number(r.bobot), 0);
    return success(res, {
      data: rows,
      meta: { total: rows.length, totalBobotAktif: Number(totalBobot.toFixed(4)) },
    });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/nilai/kriteria — tambah kriteria (Admin) */
const tambahKriteria = async (req, res, next) => {
  try {
    const row = await Kriteria.create(req.body);
    return created(res, { message: 'Kriteria berhasil ditambahkan.', data: row });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/nilai/kriteria/:id — ubah kriteria & bobot (Admin, FR-4) */
const ubahKriteria = async (req, res, next) => {
  try {
    const row = await Kriteria.findByPk(req.params.id);
    if (!row) return fail(res, { message: 'Kriteria tidak ditemukan.', statusCode: 404 });
    row.set(req.body);
    await row.save();
    return success(res, { message: 'Kriteria berhasil diperbarui.', data: row });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/nilai/kriteria/:id — hapus kriteria (Admin) */
const hapusKriteria = async (req, res, next) => {
  try {
    const row = await Kriteria.findByPk(req.params.id);
    if (!row) return fail(res, { message: 'Kriteria tidak ditemukan.', statusCode: 404 });
    await row.destroy();
    return success(res, { message: 'Kriteria berhasil dihapus.', data: { id: row.id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  daftar, tambah, tambahBatch, ubah, hapus,
  perkembangan, daftarPeriode,
  daftarKriteria, tambahKriteria, ubahKriteria, hapusKriteria,
};
