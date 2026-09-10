const express = require('express');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerUserRules } = require('../validations/auth.validation');
const { idParam } = require('../validations/santri.validation');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Menu "Kelola User" — seluruhnya khusus Admin.
 */
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', controller.daftar);
router.post('/', registerUserRules, validate, controller.tambah);
router.get('/:id', idParam, validate, controller.detail);
router.put('/:id', idParam, validate, controller.ubah);
router.delete('/:id', idParam, validate, controller.hapus);

module.exports = router;
