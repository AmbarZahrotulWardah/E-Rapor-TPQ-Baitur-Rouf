const sawService = require('../services/saw.service');
const { HasilSAW, Santri, Kelas } = require('../models');
const { success, fail } = require('../utils/response');
const { BASIS_NORMALISASI } = require('../utils/constants');

/**
 * GET /api/v1/saw/hitung/:idSantri — FR-4
 * Memicu perhitungan SAW untuk satu santri lalu mengembalikan hasilnya.
 */
const hitungSatuSantri = async (req, res, next) => {
  try {
    const hasil = await sawService.hitungDanSimpan({
      idSantri: req.params.idSantri,
      periode: req.query.periode,
      basis: req.query.basis || BASIS_NORMALISASI.SKALA_PENUH,
    });
    return success(res, {
      message: `Perhitungan SAW selesai untuk periode ${hasil.periode}.`,
      data: hasil,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/saw/hitung-kelas/:idKelas — FR-4
 * Menghitung seluruh santri dalam satu kelas (memungkinkan perangkingan).
 */
const hitungSatuKelas = async (req, res, next) => {
  try {
    const hasil = await sawService.hitungDanSimpan({
      idKelas: req.params.idKelas,
      periode: req.query.periode,
      basis: req.query.basis || BASIS_NORMALISASI.ANTAR_SANTRI,
    });
    return success(res, {
      message: `Perhitungan SAW selesai untuk ${hasil.hasil.length} santri.`,
      data: hasil,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/saw/hitung-semua — FR-4 (dipicu Admin) */
const hitungSemua = async (req, res, next) => {
  try {
    const hasil = await sawService.hitungDanSimpan({
      periode: req.query.periode,
      basis: req.query.basis || BASIS_NORMALISASI.SKALA_PENUH,
    });
    return success(res, {
      message: `Perhitungan SAW selesai untuk ${hasil.hasil.length} santri.`,
      data: hasil,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/saw/hasil/:idSantri — ambil hasil tersimpan */
const hasilSatuSantri = async (req, res, next) => {
  try {
    const rows = await sawService.ambilHasilTersimpan(req.params.idSantri, req.query.periode || null);
    if (rows.length === 0) {
      return fail(res, {
        message: 'Hasil SAW belum tersedia. Jalankan perhitungan terlebih dahulu.',
        statusCode: 404,
      });
    }
    return success(res, { data: rows });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/saw/peringkat/:idKelas — perangkingan antar santri */
const peringkat = async (req, res, next) => {
  try {
    const santriList = await Santri.findAll({
      where: { id_kelas: req.params.idKelas },
      attributes: ['id', 'nis', 'nama'],
      include: [{ model: Kelas, as: 'kelas', attributes: ['nama_kelas'] }],
    });
    if (santriList.length === 0) return fail(res, { message: 'Kelas tidak memiliki santri.', statusCode: 404 });

    const where = { id_santri: santriList.map((s) => s.id) };
    if (req.query.periode) where.periode = req.query.periode;

    const hasil = await HasilSAW.findAll({
      where,
      order: [['nilai_akhir', 'DESC']],
    });

    return success(res, {
      data: hasil.map((h) => {
        const s = santriList.find((x) => x.id === h.id_santri);
        return {
          idSantri: h.id_santri,
          nis: s?.nis,
          nama: s?.nama,
          periode: h.periode,
          nilaiAkhir: Number(h.nilai_akhir),
          nilaiSkala100: Number((Number(h.nilai_akhir) * 100).toFixed(2)),
          predikat: h.predikat,
          ranking: h.ranking,
        };
      }),
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/saw/kriteria — kriteria aktif + cek total bobot (FR-4) */
const kriteriaSaw = async (req, res, next) => {
  try {
    const kriteria = await sawService.ambilKriteriaAktif();
    let totalBobot = 0;
    let pesanValidasi = 'Total bobot valid (= 1).';
    try {
      totalBobot = sawService.validasiTotalBobot(kriteria);
    } catch (e) {
      pesanValidasi = e.message;
    }
    return success(res, { data: { kriteria, totalBobot, valid: pesanValidasi.startsWith('Total bobot valid'), pesanValidasi } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  hitungSatuSantri,
  hitungSatuKelas,
  hitungSemua,
  hasilSatuSantri,
  peringkat,
  kriteriaSaw,
};
