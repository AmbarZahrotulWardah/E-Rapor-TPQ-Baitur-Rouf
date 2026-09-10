const express = require('express');
const controller = require('../controllers/rapor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { pastikanMilikWali } = require('../middlewares/ownership.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authenticate);

/**
 * Wali santri hanya boleh membuka rapor anaknya sendiri.
 * Pemeriksaan memakai middleware bersama agar sama persis dengan
 * endpoint dashboard dan grafik perkembangan.
 */
router.get(
  '/:idSantri/pdf',
  authorize(ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI),
  pastikanMilikWali('idSantri'),
  controller.cetakPdf
);

/** GET /api/v1/rapor/:idSantri/data?periode=... — pratinjau JSON */
router.get(
  '/:idSantri/data',
  authorize(ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI),
  pastikanMilikWali('idSantri'),
  controller.dataRapor
);

module.exports = router;
