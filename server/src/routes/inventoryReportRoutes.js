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

module.exports = router;
