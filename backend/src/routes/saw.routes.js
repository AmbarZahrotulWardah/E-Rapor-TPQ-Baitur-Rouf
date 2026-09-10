const express = require('express');
const controller = require('../controllers/saw.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { periodeQuery, basisQuery } = require('../validations/nilai.validation');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authenticate);

/**
 * FR-4 — Perhitungan SAW.
 * Sesuai Vault/design.md §7, pemicu perhitungan dibatasi untuk Admin & Ustadz.
 * Wali santri memperoleh hasilnya lewat endpoint dashboard dan rapor.
 */
router.get('/kriteria', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.kriteriaSaw);

router.get(
  '/hitung/:idSantri',
  authorize(ROLES.ADMIN, ROLES.USTADZ),
  periodeQuery,
  basisQuery,
  validate,
  controller.hitungSatuSantri
);

router.get(
  '/hitung-kelas/:idKelas',
  authorize(ROLES.ADMIN, ROLES.USTADZ),
  periodeQuery,
  basisQuery,
  validate,
  controller.hitungSatuKelas
);

router.get(
  '/hitung-semua',
  authorize(ROLES.ADMIN),
  periodeQuery,
  basisQuery,
  validate,
  controller.hitungSemua
);

// Hasil tersimpan boleh dibaca semua role (controller menjaga kepemilikan data).
router.get('/hasil/:idSantri', authorize(ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI), controller.hasilSatuSantri);
router.get('/peringkat/:idKelas', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.peringkat);

module.exports = router;
