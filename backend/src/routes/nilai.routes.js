const express = require('express');
const controller = require('../controllers/nilai.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createNilaiRules,
  updateNilaiRules,
  createNilaiBatchRules,
  kriteriaRules,
  idParam,
} = require('../validations/nilai.validation');
const { pastikanMilikWali } = require('../middlewares/ownership.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authenticate);

/* -------------------------- Kriteria SAW ---------------------------- */
// Dideklarasikan sebelum "/:id" agar tidak dianggap sebagai parameter ID.
router.get('/kriteria', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.daftarKriteria);
router.post('/kriteria', authorize(ROLES.ADMIN), kriteriaRules, validate, controller.tambahKriteria);
router.put('/kriteria/:id', authorize(ROLES.ADMIN), kriteriaRules, validate, controller.ubahKriteria);
router.delete('/kriteria/:id', authorize(ROLES.ADMIN), idParam, validate, controller.hapusKriteria);

/* ------------------------ Grafik perkembangan ----------------------- */
// FR-6: Admin & Ustadz bebas; Wali Santri dibatasi pada anaknya sendiri.
// Pemeriksaan kepemilikan dilakukan middleware agar seragam di semua endpoint.
router.get(
  '/perkembangan/:idSantri',
  authorize(ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI),
  pastikanMilikWali('idSantri'),
  controller.perkembangan
);
router.get('/periode', authorize(ROLES.ADMIN, ROLES.USTADZ, ROLES.WALI_SANTRI), controller.daftarPeriode);

/* ----------------------------- Nilai -------------------------------- */
// FR-3: input nilai adalah kewenangan Ustadz; Admin dapat melihat semuanya.
router.get('/', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.daftar);
router.post('/', authorize(ROLES.ADMIN, ROLES.USTADZ), createNilaiRules, validate, controller.tambah);
router.post('/batch', authorize(ROLES.ADMIN, ROLES.USTADZ), createNilaiBatchRules, validate, controller.tambahBatch);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.USTADZ), updateNilaiRules, validate, controller.ubah);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.USTADZ), idParam, validate, controller.hapus);

module.exports = router;
