const express = require("express");
const router = express.Router();
const inventoryReportController = require("../controllers/inventoryReportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);


// ========== INVENTORY REPORTS ==========

// GET - Mendapatkan laporan nilai inventaris
router.get(
  "/value/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryReportController.getInventoryValueReport
);

// GET - Mendapatkan laporan pergerakan inventaris
router.get(
  "/movement/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryReportController.getInventoryMovementReport
);

// GET - Mendapatkan laporan produk kadaluarsa
router.get(
  "/expiring",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryReportController.getExpiringProductsReport
);

// GET - Mendapatkan ringkasan produk kadaluarsa per kategori
router.get(
  "/expiring/by-category",
  hasPermission(["inventory:read"], { checkBranch: true }),
  inventoryReportController.getExpiringByCategory
);

module.exports = router;
