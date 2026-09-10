const express = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginRules, registerUserRules, ubahPasswordRules } = require('../validations/auth.validation');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/** POST /api/v1/auth/login — semua role (FR-1) */
router.post('/login', loginRules, validate, controller.login);

/** GET /api/v1/auth/me — semua role terautentikasi */
router.get('/me', authenticate, controller.me);

/** PUT /api/v1/auth/password — ubah password sendiri */
router.put('/password', authenticate, ubahPasswordRules, validate, controller.ubahPassword);

/** Kelola akun oleh Admin (Decision Log D-3: wali didaftarkan admin) */
router.get('/user', authenticate, authorize(ROLES.ADMIN), controller.daftarUser);
router.post('/user', authenticate, authorize(ROLES.ADMIN), registerUserRules, validate, controller.buatUser);
router.put('/user/:id', authenticate, authorize(ROLES.ADMIN), controller.ubahUser);
router.delete('/user/:id', authenticate, authorize(ROLES.ADMIN), controller.hapusUser);

module.exports = router;
