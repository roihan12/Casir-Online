const express = require('express');
const router = express.Router();
const laporanKehadiranController = require('../controllers/laporanKehadiranController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', laporanKehadiranController.getPreviewLaporan);
router.get('/export', laporanKehadiranController.exportExcel);
router.get('/export-pdf', laporanKehadiranController.exportPDF);

module.exports = router;
