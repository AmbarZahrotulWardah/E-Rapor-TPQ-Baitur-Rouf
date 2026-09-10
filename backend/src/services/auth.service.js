const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User } = require('../models');
const { REDIRECT_PER_ROLE } = require('../utils/constants');

const httpError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

/** FR-1 — autentikasi email + password, menghasilkan JWT berisi role. */
const login = async ({ email, password }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) throw httpError('Email atau password salah.', 401);
  if (!user.aktif) throw httpError('Akun dinonaktifkan. Hubungi admin TPQ.', 403);

  const cocok = await bcrypt.compare(password, user.password);
  if (!cocok) throw httpError('Email atau password salah.', 401);

  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  return {
    token,
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    redirectTo: REDIRECT_PER_ROLE[user.role],
  };
};

/** Membuat akun baru (dipakai Admin — Decision Log D-3). */
const buatUser = async ({ nama, email, password, role, aktif = true }) => {
  const hash = await bcrypt.hash(password, config.bcryptSaltRounds);
  const user = await User.create({ nama, email, password: hash, role, aktif });
  return { id: user.id, nama: user.nama, email: user.email, role: user.role, aktif: user.aktif };
};

const ubahPassword = async ({ userId, passwordLama, passwordBaru }) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw httpError('Akun tidak ditemukan.', 404);
  const cocok = await bcrypt.compare(passwordLama, user.password);
  if (!cocok) throw httpError('Password lama tidak sesuai.', 400);
  user.password = await bcrypt.hash(passwordBaru, config.bcryptSaltRounds);
  await user.save();
  return { message: 'Password berhasil diubah.' };
};

module.exports = { login, buatUser, ubahPassword };
