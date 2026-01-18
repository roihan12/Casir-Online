const express = require("express");
const router = express.Router();
const TransactionDashboardController = require("../controllers/transactionDashboardController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Middleware autentikasi untuk semua rute dashboard transaksi
router.use(authenticate);

/**
 * @route GET /api/transaction-dashboard
 * @desc Mendapatkan data dashboard transaksi
 * @access Private (admin_cabang, super_admin)
 */
router.get(
  "/",
  hasPermission(["transaksi:read"]),
  TransactionDashboardController.getTransactionDashboardData
);

/**
 * @route POST /api/transaction-dashboard/invalidate-cache
 * @desc Menghapus cache dashboard transaksi
 * @access Private (admin_cabang, super_admin)
 */
router.post(
  "/invalidate-cache",
  hasPermission(["transaksi:manage"]),
  TransactionDashboardController.invalidateTransactionDashboardCache
);

module.exports = router;