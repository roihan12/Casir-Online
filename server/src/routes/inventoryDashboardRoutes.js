const express = require("express");
const InventoryDashboardController = require("../controllers/inventoryDashboardController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Middleware autentikasi untuk semua rute dashboard inventory
router.use(authenticate);

router.get(
  "/",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getInventoryDashboardData
);

router.get(
  "/new",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getInventoryNewDashboardData
);

router.get(
  "/low-stock",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getLowStockProducts
);

router.get(
  "/stock-kadaluwarsa",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getStockKadaluwarsa
);

router.get(
  "/stock-movement",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getStockMovementData
);

router.get(
  "/high-stock-movement",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getHighStockMovementData
);

router.get(
  "/stock-value",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getStockValue
);

router.get(
  "/branch-transfer",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getBranchTransferData
);

router.get(
  "/inventory-health-score",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getInventoryHealthScore
);

router.get(
  "/activities",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getInventoryActivities
);

router.get(
  "/value-by-category",
  hasPermission(["inventory:read"]),
  InventoryDashboardController.getInventoryValueByCategory
);

module.exports = router;
