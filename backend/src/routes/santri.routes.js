const express = require('express');
const controller = require('../controllers/santri.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createSantriRules, updateSantriRules, idParam } = require('../validations/santri.validation');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authenticate);

/* ------------------------- Pengelolaan kelas ------------------------- */
// Rute "kelas" dideklarasikan sebelum "/:id" agar tidak tertangkap sebagai ID.
router.get('/kelas', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.daftarKelas);
router.post('/kelas', authorize(ROLES.ADMIN), controller.tambahKelas);
router.put('/kelas/:id', authorize(ROLES.ADMIN), controller.ubahKelas);
router.delete('/kelas/:id', authorize(ROLES.ADMIN), controller.hapusKelas);

/* --------------------------- Data santri ---------------------------- */
// FR-2: Admin & Ustadz dapat melihat; Admin yang menambah/mengubah/menghapus.
router.get('/', authorize(ROLES.ADMIN, ROLES.USTADZ), controller.daftar);
router.post('/', authorize(ROLES.ADMIN, ROLES.USTADZ), createSantriRules, validate, controller.tambah);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.USTADZ), idParam, validate, controller.detail);
router.put('/:id', authorize(ROLES.ADMIN), updateSantriRules, validate, controller.ubah);
router.delete('/:id', authorize(ROLES.ADMIN), idParam, validate, controller.hapus);

module.exports = router;
