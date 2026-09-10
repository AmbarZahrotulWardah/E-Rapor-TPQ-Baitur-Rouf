const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/**
 * Middleware validasi input berbasis express-validator.
 * Mengumpulkan seluruh galat validasi lalu mengembalikannya sekaligus
 * agar pengguna dapat memperbaiki semua isian dalam satu kali percobaan.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));

  return fail(res, {
    message: 'Data yang dikirim tidak valid.',
    statusCode: 422,
    errors,
  });
};

module.exports = { validate };
