const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// GET - Get receipt configuration
router.get(
  "/config/:cabangId",
  hasPermission(["settings:read"], { checkBranch: true }),
  receiptController.getReceiptConfig
);

// PUT - Update receipt configuration
router.put(
  "/config/:cabangId",
  hasPermission(["settings:manage"], { checkBranch: true }),
  receiptController.updateReceiptConfig
);

// GET - Get receipt preview
router.get(
  "/preview/:transaksiId",
  hasPermission(["transaksi:read"]),
  receiptController.getReceiptPreview
);

// POST - Send receipt by email
router.post(
  "/email",
  hasPermission(["transaksi:read"]),
  receiptController.sendReceiptByEmail
);

// POST - Send receipt by WhatsApp
router.post(
  "/whatsapp",
  hasPermission(["transaksi:read"]),
  receiptController.sendReceiptByWhatsapp
);

// GET - Get transaction data for receipt (JSON format)
router.get(
  "/transaction/:transaksiId",
  hasPermission(["transaksi:read"]),
  receiptController.getTransactionData
);

module.exports = router;
