const express = require("express");
const router = express.Router();
const qrisController = require("../controllers/qrisController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== QRIS MANAGEMENT ==========

// POST - Callback from Midtrans (no auth required) - Move this above router.use(authenticate) to be safe
router.post(
  "/notification",
  qrisController.handleQrisCallback
);

router.use(authenticate);

// POST - Create QRIS payment
router.post(
  "/",
  hasPermission(["transaksi:create"]),
  qrisController.createQrisPayment
);

// GET - Check QRIS status
router.get(
  "/:reference_id/status",
  hasPermission(["transaksi:read"]),
  qrisController.checkQrisStatus
);

// POST - Cancel QRIS payment
router.post(
  "/:reference_id/cancel",
  hasPermission(["transaksi:manage"]),
  qrisController.cancelQrisPayment
);

module.exports = router;
