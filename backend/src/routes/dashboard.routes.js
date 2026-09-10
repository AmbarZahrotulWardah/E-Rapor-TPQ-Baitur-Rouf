const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { pastikanMilikWali } = require('../middlewares/ownership.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authenticate);

/** Dashboard Admin — ringkasan data & distribusi predikat */
router.get('/admin', authorize(ROLES.ADMIN), controller.admin);

/** Dashboard Ustadz — kelas yang diampu & progres input nilai */
router.get('/ustadz', authorize(ROLES.USTADZ, ROLES.ADMIN), controller.ustadz);

/** FR-5 — daftar anak yang terhubung dengan akun wali */
router.get('/wali/saya', authorize(ROLES.WALI_SANTRI), controller.anakSaya);

/**
 * FR-5 — dashboard & grafik perkembangan satu anak.
 * Wali santri dibatasi pada anaknya sendiri melalui middleware.
 */
router.get(
  '/wali/:idSantri',
  authorize(ROLES.WALI_SANTRI, ROLES.ADMIN, ROLES.USTADZ),
  pastikanMilikWali('idSantri'),
  controller.wali
);

module.exports = router;
