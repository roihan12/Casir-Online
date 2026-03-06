const express = require('express');
const router = express.Router();
const dashboardAbsensiAdminController = require('../controllers/dashboardAbsensiAdminController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);


router.get('/hari-ini/:cabangId', dashboardAbsensiAdminController.getHariIni);
router.get('/belum-absen/:cabangId', dashboardAbsensiAdminController.getBelumAbsen);
router.get('/tren/:cabangId', dashboardAbsensiAdminController.getTren);
router.get('/top-terlambat/:cabangId', dashboardAbsensiAdminController.getTopTerlambat);
router.get('/rekap-lembur/:cabangId', dashboardAbsensiAdminController.getRekapLembur);
router.get('/pending/:cabangId', dashboardAbsensiAdminController.getPendingApproval);

module.exports = router;
