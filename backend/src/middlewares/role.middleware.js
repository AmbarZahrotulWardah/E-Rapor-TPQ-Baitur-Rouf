const { fail } = require('../utils/response');
const { ROLE_LIST } = require('../utils/constants');

/**
 * Middleware RBAC (FR-1) — membatasi endpoint hanya untuk role tertentu.
 * Pemakaian: router.get('/...', authenticate, authorize('admin','ustadz'), handler)
 */
const authorize = (...rolesDiizinkan) => {
  const daftar = rolesDiizinkan.flat().filter((r) => ROLE_LIST.includes(r));

  return (req, res, next) => {
    if (!req.user) {
      return fail(res, { message: 'Autentikasi diperlukan.', statusCode: 401 });
    }
    if (!daftar.includes(req.user.role)) {
      return fail(res, {
        message: `Akses ditolak: halaman ini hanya untuk role ${daftar.join(' atau ')}.`,
        statusCode: 403,
      });
    }
    return next();
  };
};

module.exports = { authorize };
