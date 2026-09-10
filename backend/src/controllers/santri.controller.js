const { Santri, Kelas, User } = require('../models');
const { success, created, fail } = require('../utils/response');
const { ROLES } = require('../utils/constants');

const includeRelasi = [
  { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'id_ustadz'] },
  { model: User, as: 'wali', attributes: ['id', 'nama', 'email'] },
];

/** GET /api/v1/santri — daftar santri (Admin & Ustadz) */
const daftar = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.id_kelas) where.id_kelas = req.query.id_kelas;
    if (req.query.status) where.status = req.query.status;
    if (req.query.cari) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { nama: { [Op.like]: `%${req.query.cari}%` } },
        { nis: { [Op.like]: `%${req.query.cari}%` } },
      ];
    }
    const rows = await Santri.findAll({ where, include: includeRelasi, order: [['nama', 'ASC']] });
    return success(res, { data: rows, meta: { total: rows.length } });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/santri/:id */
const detail = async (req, res, next) => {
  try {
    const santri = await Santri.findByPk(req.params.id, { include: includeRelasi });
    if (!santri) return fail(res, { message: 'Santri tidak ditemukan.', statusCode: 404 });
    return success(res, { data: santri });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/santri — FR-2 */
const tambah = async (req, res, next) => {
  try {
    if (req.body.id_kelas) {
      const kelas = await Kelas.findByPk(req.body.id_kelas);
      if (!kelas) return fail(res, { message: 'Kelas tidak ditemukan.', statusCode: 404 });
    }
    if (req.body.id_wali) {
      const wali = await User.findByPk(req.body.id_wali);
      if (!wali) return fail(res, { message: 'Akun wali santri tidak ditemukan.', statusCode: 404 });
      if (wali.role !== ROLES.WALI_SANTRI) {
        return fail(res, { message: 'Akun yang dipilih bukan berperan sebagai wali santri.', statusCode: 422 });
      }
    }
    const santri = await Santri.create(req.body);
    return created(res, { message: 'Data santri berhasil ditambahkan.', data: santri });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/santri/:id — FR-2 */
const ubah = async (req, res, next) => {
  try {
    const santri = await Santri.findByPk(req.params.id);
    if (!santri) return fail(res, { message: 'Santri tidak ditemukan.', statusCode: 404 });
    santri.set(req.body);
    await santri.save();
    return success(res, { message: 'Data santri berhasil diperbarui.', data: santri });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/santri/:id — FR-2 */
const hapus = async (req, res, next) => {
  try {
    const santri = await Santri.findByPk(req.params.id);
    if (!santri) return fail(res, { message: 'Santri tidak ditemukan.', statusCode: 404 });
    await santri.destroy();
    return success(res, { message: 'Data santri berhasil dihapus.', data: { id: santri.id } });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/santri/kelas — daftar kelas beserta ustadz pengampu */
const daftarKelas = async (req, res, next) => {
  try {
    const rows = await Kelas.findAll({
      include: [{ model: User, as: 'ustadz', attributes: ['id', 'nama', 'email'] }],
      order: [['nama_kelas', 'ASC']],
    });
    return success(res, { data: rows, meta: { total: rows.length } });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/santri/kelas — tambah kelas (Admin) */
const tambahKelas = async (req, res, next) => {
  try {
    const kelas = await Kelas.create(req.body);
    return created(res, { message: 'Kelas berhasil ditambahkan.', data: kelas });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/santri/kelas/:id — ubah kelas (Admin) */
const ubahKelas = async (req, res, next) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return fail(res, { message: 'Kelas tidak ditemukan.', statusCode: 404 });
    kelas.set(req.body);
    await kelas.save();
    return success(res, { message: 'Kelas berhasil diperbarui.', data: kelas });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/santri/kelas/:id — hapus kelas (Admin) */
const hapusKelas = async (req, res, next) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return fail(res, { message: 'Kelas tidak ditemukan.', statusCode: 404 });
    await kelas.destroy();
    return success(res, { message: 'Kelas berhasil dihapus.', data: { id: kelas.id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  daftar, detail, tambah, ubah, hapus,
  daftarKelas, tambahKelas, ubahKelas, hapusKelas,
};
