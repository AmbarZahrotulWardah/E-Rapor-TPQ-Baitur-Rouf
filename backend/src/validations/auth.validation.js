const { body } = require('express-validator');
const { ROLE_LIST } = require('../utils/constants');

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

const registerUserRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').notEmpty().withMessage('Role wajib dipilih').isIn(ROLE_LIST).withMessage(`Role harus salah satu dari: ${ROLE_LIST.join(', ')}`),
];

const ubahPasswordRules = [
  body('passwordLama').notEmpty().withMessage('Password lama wajib diisi'),
  body('passwordBaru').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
];

module.exports = { loginRules, registerUserRules, ubahPasswordRules };
