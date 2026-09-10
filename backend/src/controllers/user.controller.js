const { User, Santri, Kelas } = require('../models');
const authService = require('../services/auth.service');
const { success, created, fail } = require('../utils/response');
const { ROLES } = require('../utils/constants');

/**
 * Modul "Kelola User" untuk Admin.
 * Fungsinya beririsan dengan auth.controller, tetapi dipisahkan agar
 * menu administrasi pengguna berdiri sendiri (sesuai struktur folder awal).
 */

/** GET /api/v1/users — daftar user, bisa difilter per role */
const daftar = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.aktif !== undefined) where.aktif = req.query.aktif === 'true';

    const rows = await User.findAll({ where, order: [['role', 'ASC'], ['nama', 'ASC']] });

    // Lengkapi info jumlah santri/kelas yang terkait tiap akun.
    const hasil = await Promise.all(
      rows.map(async (u) => {
        if (u.role === ROLES.WALI_SANTRI) {
          const jumlah = await Santri.count({ where: { id_wali: u.id } });
          return { ...u.toJSON(), jumlahSantri: jumlah };
        }
        if (u.role === ROLES.USTADZ) {
          const jumlah = await Kelas.count({ where: { id_ustadz: u.id } });
          return { ...u.toJSON(), jumlahKelas: jumlah };
        }
        return u.toJSON();
      })
    );

    return success(res, { data: hasil, meta: { total: hasil.length } });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/users/:id */
const detail = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 404 });
    return success(res, { data: user });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/users — Admin membuat akun ustadz/wali/admin baru */
const tambah = async (req, res, next) => {
  try {
    const user = await authService.buatUser(req.body);
    return created(res, { message: 'Akun berhasil ditambahkan.', data: user });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/users/:id — ubah data akun */
const ubah = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 404 });

    const { nama, email, role, aktif, password } = req.body;
    user.set({
      ...(nama !== undefined && { nama }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(aktif !== undefined && { aktif }),
    });
    if (password) {
      const bcrypt = require('bcryptjs');
      const config = require('../config/env');
      user.password = await bcrypt.hash(password, config.bcryptSaltRounds);
    }
    await user.save();
    return success(res, {
      message: password ? 'Akun dan password berhasil diperbarui.' : 'Akun berhasil diperbarui.',
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/users/:id — hapus akun */
const hapus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 404 });
    if (user.id === req.user.id) {
      return fail(res, { message: 'Tidak dapat menghapus akun yang sedang digunakan.', statusCode: 422 });
    }
    await user.destroy();
    return success(res, { message: 'Akun berhasil dihapus.', data: { id: user.id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { daftar, detail, tambah, ubah, hapus };
