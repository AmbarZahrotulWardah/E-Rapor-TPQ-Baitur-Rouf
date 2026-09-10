const { Santri } = require('../models');
const { fail } = require('../utils/response');
const { ROLES } = require('../utils/constants');

/**
 * Middleware penjaga kepemilikan data santri (FR-5).
 *
 * Wali santri hanya boleh membuka data anak yang tertaut pada akunnya
 * (kolom `santri.id_wali`). Admin dan ustadz tidak dibatasi di sini.
 *
 * Dipakai pada seluruh endpoint yang menerima `:idSantri` agar pemeriksaan
 * berlaku seragam untuk PDF, JSON, dashboard, maupun grafik.
 *
 * @param {string} namaParam - nama parameter rute, default `idSantri`
 */
const pastikanMilikWali = (namaParam = 'idSantri') => async (req, res, next) => {
  try {
    if (req.user?.role !== ROLES.WALI_SANTRI) return next();

    const idSantri = Number(req.params[namaParam]);
    if (!idSantri) {
      return fail(res, { message: 'Parameter ID santri tidak valid.', statusCode: 422 });
    }

    const santri = await Santri.findByPk(idSantri);
    if (!santri) return fail(res, { message: 'Data santri tidak ditemukan.', statusCode: 404 });

    if (santri.id_wali !== req.user.id) {
      return fail(res, {
        message: 'Akses ditolak: data ini bukan milik anak Anda.',
        statusCode: 403,
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { pastikanMilikWali };
