const { body, param, query } = require('express-validator');
const { SKOR_MIN, SKOR_MAX, BASIS_NORMALISASI } = require('../utils/constants');

const idParam = param('id').isInt({ min: 1 }).withMessage('ID tidak valid').toInt();

/** Validasi skor mentah 0-100 (FR-3). */
const createNilaiRules = [
  body('id_santri').isInt({ min: 1 }).withMessage('Santri wajib dipilih').toInt(),
  body('id_kriteria').isInt({ min: 1 }).withMessage('Kriteria wajib dipilih').toInt(),
  body('skor')
    .notEmpty().withMessage('Skor wajib diisi')
    .isFloat({ min: SKOR_MIN, max: SKOR_MAX })
    .withMessage(`Skor harus berupa angka antara ${SKOR_MIN} sampai ${SKOR_MAX}`)
    .toFloat(),
  body('pertemuan_ke').isInt({ min: 1 }).withMessage('Pertemuan ke- minimal 1').toInt(),
  body('periode').trim().notEmpty().withMessage('Periode wajib diisi').isLength({ max: 30 }).withMessage('Periode maksimal 30 karakter'),
  body('tanggal').isISO8601().withMessage('Tanggal wajib diisi dengan format YYYY-MM-DD'),
  body('catatan').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Catatan maksimal 255 karakter'),
];

const updateNilaiRules = [
  idParam,
  body('skor').optional().isFloat({ min: SKOR_MIN, max: SKOR_MAX }).withMessage(`Skor harus antara ${SKOR_MIN}-${SKOR_MAX}`).toFloat(),
  body('pertemuan_ke').optional().isInt({ min: 1 }).toInt(),
  body('periode').optional().trim().notEmpty(),
  body('tanggal').optional().isISO8601().withMessage('Format tanggal harus YYYY-MM-DD'),
  body('catatan').optional({ values: 'falsy' }).trim(),
];

/** Input nilai massal untuk satu santri pada satu pertemuan (mempercepat input ustadz). */
const createNilaiBatchRules = [
  body('id_santri').isInt({ min: 1 }).withMessage('Santri wajib dipilih').toInt(),
  body('pertemuan_ke').isInt({ min: 1 }).withMessage('Pertemuan ke- minimal 1').toInt(),
  body('periode').trim().notEmpty().withMessage('Periode wajib diisi'),
  body('tanggal').isISO8601().withMessage('Tanggal wajib diisi dengan format YYYY-MM-DD'),
  body('nilai').isArray({ min: 1 }).withMessage('Minimal satu kriteria harus diisi'),
  body('nilai.*.id_kriteria').isInt({ min: 1 }).withMessage('Kriteria tidak valid'),
  body('nilai.*.skor')
    .isFloat({ min: SKOR_MIN, max: SKOR_MAX })
    .withMessage(`Skor harus antara ${SKOR_MIN}-${SKOR_MAX}`),
  body('catatan').optional({ values: 'falsy' }).trim(),
];

const kriteriaRules = [
  body('kode').trim().notEmpty().withMessage('Kode kriteria wajib diisi').isLength({ max: 10 }),
  body('nama').trim().notEmpty().withMessage('Nama kriteria wajib diisi').isLength({ max: 100 }),
  body('bobot').isFloat({ min: 0, max: 1 }).withMessage('Bobot harus antara 0 sampai 1').toFloat(),
  body('jenis').optional().isIn(['benefit', 'cost']).withMessage('Jenis harus benefit atau cost'),
  body('kelompok').optional().isIn(['tajwid', 'akademik', 'lainnya']).withMessage('Kelompok tidak dikenali'),
  body('urutan').optional().isInt({ min: 0 }).toInt(),
];

const periodeQuery = query('periode').optional().trim();
const basisQuery = query('basis').optional().isIn(Object.values(BASIS_NORMALISASI)).withMessage('Basis normalisasi tidak dikenali');

module.exports = {
  createNilaiRules,
  updateNilaiRules,
  createNilaiBatchRules,
  kriteriaRules,
  idParam,
  periodeQuery,
  basisQuery,
};
