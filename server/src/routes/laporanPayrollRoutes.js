const express = require('express');
const router = express.Router();
const laporanPayrollController = require('../controllers/laporanPayrollController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', laporanPayrollController.getPreviewPayroll);
router.get('/export', laporanPayrollController.exportExcel);

module.exports = router;
