const authService = require('../services/auth.service');
const { User } = require('../models');
const { success, created, fail } = require('../utils/response');

/** POST /api/v1/auth/login — FR-1 */
const login = async (req, res, next) => {
  try {
    const hasil = await authService.login(req.body);
    return success(res, { message: 'Login berhasil.', data: hasil });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/auth/me — profil user yang sedang login */
const me = async (req, res) => success(res, { message: 'Data user saat ini.', data: req.user });

/** POST /api/v1/auth/user — Admin membuat akun baru (Decision Log D-3) */
const buatUser = async (req, res, next) => {
  try {
    const user = await authService.buatUser(req.body);
    return created(res, { message: 'Akun berhasil ditambahkan.', data: user });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/auth/user — daftar akun (Admin) */
const daftarUser = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.role) where.role = req.query.role;
    const users = await User.findAll({ where, order: [['role', 'ASC'], ['nama', 'ASC']] });
    return success(res, { data: users, meta: { total: users.length } });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/auth/user/:id — ubah data akun (Admin) */
const ubahUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 404 });
    const { nama, email, role, aktif } = req.body;
    user.set({
      ...(nama !== undefined && { nama }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(aktif !== undefined && { aktif }),
    });
    await user.save();
    return success(res, { message: 'Akun berhasil diperbarui.', data: user });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/auth/user/:id — hapus akun (Admin) */
const hapusUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 404 });
    if (user.id === req.user.id) {
      return fail(res, { message: 'Tidak dapat menghapus akun sendiri.', statusCode: 422 });
    }
    await user.destroy();
    return success(res, { message: 'Akun berhasil dihapus.', data: { id: user.id } });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/auth/password — ubah password sendiri */
const ubahPassword = async (req, res, next) => {
  try {
    const hasil = await authService.ubahPassword({
      userId: req.user.id,
      passwordLama: req.body.passwordLama,
      passwordBaru: req.body.passwordBaru,
    });
    return success(res, { message: hasil.message });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, me, buatUser, daftarUser, ubahUser, hapusUser, ubahPassword };
