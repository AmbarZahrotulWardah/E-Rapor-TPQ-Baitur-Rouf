/**
 * Helper untuk menyamakan bentuk respons REST API.
 * Semua endpoint mengembalikan `{ success, message, data }` agar frontend
 * dapat menangani respons secara seragam.
 */

const success = (res, { message = 'OK', data = null, statusCode = 200, meta = undefined } = {}) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, { message = 'Data berhasil ditambahkan', data = null } = {}) =>
  success(res, { message, data, statusCode: 201 });

const fail = (res, { message = 'Terjadi kesalahan', statusCode = 400, errors = undefined } = {}) => {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, fail };
