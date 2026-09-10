const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { fail } = require('../utils/response');
const { User } = require('../models');

/**
 * Middleware autentikasi JWT (FR-1).
 * Mengharapkan header: `Authorization: Bearer <token>`.
 * Payload token disegarkan dari database agar akun yang dinonaktifkan
 * atau dihapus langsung kehilangan akses.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [schema, headerToken] = header.split(' ');

    // Token dari header lebih diutamakan. Fallback ke query `?token=`
    // diperlukan untuk unduhan PDF yang dibuka lewat window.open,
    // karena cara tersebut tidak dapat menyisipkan header Authorization.
    const token = schema === 'Bearer' && headerToken ? headerToken : req.query.token;

    if (!token) {
      return fail(res, {
        message: 'Akses ditolak: token autentikasi tidak ditemukan.',
        statusCode: 401,
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Sesi berakhir, silakan login kembali.'
          : 'Token tidak valid.';
      return fail(res, { message, statusCode: 401 });
    }

    const user = await User.findByPk(payload.id);
    if (!user) return fail(res, { message: 'Akun tidak ditemukan.', statusCode: 401 });
    if (!user.aktif) return fail(res, { message: 'Akun dinonaktifkan.', statusCode: 403 });

    req.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { authenticate };
