const logger = require('../utils/logger');
const { fail } = require('../utils/response');
const config = require('../config/env');

/** 404 untuk rute API yang tidak terdaftar. */
const notFound = (req, res, next) => {
  fail(res, {
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
    statusCode: 404,
  });
  next();
};

/**
 * Penanganan galat terpusat.
 * Galat Sequelize diubah menjadi pesan yang ramah pengguna.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, err.stack);

  // Galat unik (duplikat NIS/email/kode kriteria)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = (err.errors || []).map((e) => `${e.path}: ${e.message}`).join('; ');
    return fail(res, {
      message: `Data duplikat. ${fields}`,
      statusCode: 409,
      errors: (err.errors || []).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Galat foreign key (mis. menghapus kelas yang masih berisi santri)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return fail(res, {
      message: 'Operasi ditolak: data masih dipakai oleh data lain (relasi foreign key).',
      statusCode: 409,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return fail(res, {
      message: 'Validasi data gagal.',
      statusCode: 422,
      errors: (err.errors || []).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return fail(res, { message: 'Format JSON pada body tidak valid.', statusCode: 400 });
  }

  const statusCode = err.statusCode || 500;
  return fail(res, {
    message: statusCode >= 500 && config.env === 'production' ? 'Terjadi kesalahan pada server.' : err.message,
    statusCode,
  });
};

module.exports = { errorHandler, notFound };
