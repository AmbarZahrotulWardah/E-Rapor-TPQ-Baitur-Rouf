const grafikService = require('../services/grafik.service');
const { Santri } = require('../models');
const { success, fail } = require('../utils/response');
const { ROLES } = require('../utils/constants');

/** GET /api/v1/dashboard/admin — ringkasan & distribusi predikat */
const admin = async (req, res, next) => {
  try {
    const data = await grafikService.dashboardAdmin();
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/dashboard/ustadz — kelas yang diampu & progres input nilai */
const ustadz = async (req, res, next) => {
  try {
    const data = await grafikService.dashboardUstadz(req.user.id);
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/dashboard/wali/:idSantri — FR-5
 * Wali santri hanya boleh membuka data anaknya sendiri.
 */
const wali = async (req, res, next) => {
  try {
    const idSantri = Number(req.params.idSantri);
    const santri = await Santri.findByPk(idSantri);
    if (!santri) return fail(res, { message: 'Data santri tidak ditemukan.', statusCode: 404 });

    if (req.user.role === ROLES.WALI_SANTRI && santri.id_wali !== req.user.id) {
      return fail(res, {
        message: 'Akses ditolak: Anda hanya dapat melihat data anak Anda sendiri.',
        statusCode: 403,
      });
    }

    const data = await grafikService.dashboardWali(idSantri);
    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/dashboard/wali/saya — daftar anak yang terhubung dengan akun wali */
const anakSaya = async (req, res, next) => {
  try {
    const rows = await Santri.findAll({
      where: { id_wali: req.user.id },
      attributes: ['id', 'nis', 'nama', 'id_kelas'],
    });
    return success(res, { data: rows, meta: { total: rows.length } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { admin, ustadz, wali, anakSaya };
