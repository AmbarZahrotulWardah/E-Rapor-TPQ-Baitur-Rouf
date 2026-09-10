const express = require('express');

const authRoutes = require('./auth.routes');
const santriRoutes = require('./santri.routes');
const nilaiRoutes = require('./nilai.routes');
const sawRoutes = require('./saw.routes');
const raporRoutes = require('./rapor.routes');
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

/**
 * Seluruh endpoint berada di bawah prefix /api/v1
 * sesuai Vault/design.md §7.
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'REST API Sistem E-Rapor Digital TPQ Baitur Rouf Surabaya',
    data: {
      versi: 'v1',
      metode: 'Simple Additive Weighting (SAW)',
      modul: {
        auth: '/api/v1/auth',
        santri: '/api/v1/santri',
        nilai: '/api/v1/nilai',
        saw: '/api/v1/saw',
        rapor: '/api/v1/rapor',
        dashboard: '/api/v1/dashboard',
        users: '/api/v1/users',
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/santri', santriRoutes);
router.use('/nilai', nilaiRoutes);
router.use('/saw', sawRoutes);
router.use('/rapor', raporRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

module.exports = router;
