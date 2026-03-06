const express = require('express');
const router = express.Router();
const dashboardAbsensiKaryawanController = require('../controllers/dashboardAbsensiKaryawanController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/me', dashboardAbsensiKaryawanController.getMe);
router.get('/me/rekap-bulan', dashboardAbsensiKaryawanController.getRekapBulan);
router.get('/me/saldo-cuti', dashboardAbsensiKaryawanController.getSaldoCuti);
router.get('/me/slip-terbaru', dashboardAbsensiKaryawanController.getSlipTerbaru);
router.get('/me/jadwal-minggu-ini', dashboardAbsensiKaryawanController.getJadwalMingguIni);

module.exports = router;
