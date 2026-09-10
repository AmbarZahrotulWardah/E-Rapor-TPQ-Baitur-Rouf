const { body, param } = require('express-validator');
const { JENIS_KELAMIN } = require('../utils/constants');

const idParam = param('id').isInt({ min: 1 }).withMessage('ID tidak valid').toInt();

const createSantriRules = [
  body('nis').trim().notEmpty().withMessage('NIS wajib diisi').isLength({ max: 20 }).withMessage('NIS maksimal 20 karakter'),
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('tempat_lahir').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Tempat lahir maksimal 100 karakter'),
  body('tanggal_lahir').optional({ values: 'falsy' }).isISO8601().withMessage('Format tanggal lahir harus YYYY-MM-DD'),
  body('jenis_kelamin').optional({ values: 'falsy' }).isIn(JENIS_KELAMIN).withMessage('Jenis kelamin harus L atau P'),
  body('alamat').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Alamat maksimal 255 karakter'),
  body('id_kelas').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Kelas tidak valid').toInt(),
  body('id_wali').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Wali santri tidak valid').toInt(),
];

const updateSantriRules = [
  idParam,
  body('nis').optional().trim().notEmpty().withMessage('NIS tidak boleh kosong').isLength({ max: 20 }),
  body('nama').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong').isLength({ max: 100 }),
  body('tempat_lahir').optional({ values: 'falsy' }).trim(),
  body('tanggal_lahir').optional({ values: 'falsy' }).isISO8601().withMessage('Format tanggal lahir harus YYYY-MM-DD'),
  body('jenis_kelamin').optional({ values: 'falsy' }).isIn(JENIS_KELAMIN),
  body('alamat').optional({ values: 'falsy' }).trim(),
  body('id_kelas').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('id_wali').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('status').optional().isIn(['aktif', 'lulus', 'pindah', 'berhenti']).withMessage('Status tidak dikenali'),
];

module.exports = { createSantriRules, updateSantriRules, idParam };
