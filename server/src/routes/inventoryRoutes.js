const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== INVENTORY ADJUSTMENTS ==========

router.use(authenticate);

// GET - Mendapatkan data pergerakan stok
router.get(
  "/movements/summary",
  hasPermission(["inventory:read"]),
  inventoryController.getStockMovementData
);

// POST - Membuat penyesuaian stok
router.post(
  "/adjustments",
  hasPermission(["inventory:update"]),
  inventoryController.createStockAdjustment
);

// GET - Mendapatkan riwayat pergerakan stok
router.get(
  "/movements",
  hasPermission(["inventory:read"]),
  inventoryController.getInventoryMovements
);

// GET - Export pergerakan stok ke CSV
router.get(
  "/movements/export",
  hasPermission(["inventory:read"]),
  inventoryController.exportInventoryMovements
);

// GET - Generate report pergerakan stok (PDF/Excel/CSV)
router.get(
  "/movements/report",
  hasPermission(["laporan:read"]),
  inventoryController.generateMovementReport
);

// POST - Entry stok awal batch
router.post(
  "/initial-entry",
  hasPermission(["inventory:update"]),
  inventoryController.batchInitialStockEntry
);

// POST - Stock opname
router.post(
  "/opname",
  hasPermission(["inventory:update"]),
  inventoryController.stockOpname
);

// ========== PRICE MANAGEMENT ==========

// PUT - Update harga produk
router.put(
  "/price",
  hasPermission(["produk:update"]),
  inventoryController.updateProductPrice
);

// GET - Mendapatkan riwayat harga produk
router.get(
  "/price-history",
  hasPermission(["produk:read"]),
  inventoryController.getPriceHistory
);

// GET - Mendapatkan laporan stok saat ini
router.get(
  "/report/:cabangId",
  hasPermission(["laporan:read"], { checkBranch: true }),
  inventoryController.getCurrentStockReport
);

module.exports = router;
