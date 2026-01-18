const express = require("express");
const router = express.Router();
const inventoryBatchController = require("../controllers/inventoryBatchController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const {authenticate} = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// ========== BATCH & EXPIRY MANAGEMENT ==========

// POST - Menambahkan stok dengan batch number dan expired date
router.post(
  "/batch",
  hasPermission(["inventory:create"]),
  inventoryBatchController.addProductBatch
);

// GET - Mendapatkan produk dengan stok yang hampir kadaluarsa
router.get(
  "/expiring/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryBatchController.getExpiringStock
);

// GET - Mendapatkan produk dengan stok di bawah minimum
router.get(
  "/minimum/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryBatchController.getMinimumStock
);

// PUT - Update pengaturan notifikasi stok
router.put(
  "/alerts",
  hasPermission(["settings:manage"]),
  inventoryBatchController.updateStockAlertSettings
);

module.exports = router;
