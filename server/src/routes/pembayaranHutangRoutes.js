const express = require("express");
const router = express.Router();
const pembayaranHutangController = require("../controllers/pembayaranHutangController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// ========== STATIC ROUTES FIRST ==========

// POST - Create pembayaran hutang (cicilan / pelunasan)
router.post(
  "/",
  hasPermission(["hutang:write"]),
  pembayaranHutangController.createPembayaranHutang
);

// GET - List hutang with filters
router.get(
  "/",
  hasPermission(["hutang:read"]),
  pembayaranHutangController.getHutangList
);

// GET - Get hutang summary for pelanggan/supplier
router.get(
  "/summary/:type/:id",
  hasPermission(["hutang:read"]),
  pembayaranHutangController.getHutangSummary
);

// ========== DYNAMIC ID ROUTES (MUST BE LAST) ==========

// GET - Get hutang detail by ID
router.get(
  "/:id",
  hasPermission(["hutang:read"]),
  pembayaranHutangController.getHutangById
);

// GET - Get pembayaran history for a hutang
router.get(
  "/:id/history",
  hasPermission(["hutang:read"]),
  pembayaranHutangController.getPembayaranHistory
);

module.exports = router;
