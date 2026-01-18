const express = require("express");
const router = express.Router();
const transaksiController = require("../controllers/transaksiController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");
const { verifyMidtransSignature } = require("../middleware/midtransSignatureMiddleware");

// ========== TRANSAKSI MANAGEMENT ==========

// Apply auth middleware to all routes except webhook
router.use(authenticate);

// ========== STATIC ROUTES FIRST ==========

// GET - List transactions
router.get(
  "/",
  hasPermission(["transaksi:read"]),
  transaksiController.getTransaksiList
);

// GET - Sales report
router.get(
  "/reports/sales",
  hasPermission(["transaksi:read"]),
  transaksiController.getSalesReport
);

// POST - Create new transaction
router.post(
  "/",
  hasPermission(["transaksi:create"]),
  transaksiController.createTransaksi
);

// POST - Create credit transaction
router.post(
  "/kredit",
  hasPermission(["transaksi:create"]),
  transaksiController.createKreditTransaction
);

// ========== PAYMENT MANAGEMENT ==========

// POST - Add payment
router.post(
  "/payment",
  hasPermission(["transaksi:create"]),
  transaksiController.addPembayaran
);

// POST - Generate QRIS payment
router.post(
  "/payment/qris",
  hasPermission(["transaksi:create"]),
  transaksiController.createQrisPayment
);

// POST - QRIS callback webhook (no auth, but requires signature verification)
router.post(
  "/payment/qris/callback",
  verifyMidtransSignature,
  transaksiController.updateQrisStatus
);

// ========== DYNAMIC ID ROUTES (MUST BE LAST) ==========

// GET - Get transaction detail
router.get(
  "/:id",
  hasPermission(["transaksi:read"]),
  transaksiController.getTransaksiById
);

// GET - Get credit payment recommendations for a transaction
router.get(
  "/:id/kredit-recommendation",
  hasPermission(["transaksi:read"]),
  transaksiController.getKreditPaymentRecommendation
);

// PUT - Cancel transaction
router.put(
  "/:id/cancel",
  hasPermission(["transaksi:delete"]),
  transaksiController.cancelTransaksi
);

module.exports = router;
