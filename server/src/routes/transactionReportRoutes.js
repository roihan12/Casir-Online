const express = require("express");
const router = express.Router();
const transactionReportController = require("../controllers/transactionReportController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

/**
 * Transaction Report Routes
 * All routes require authentication and report:read permission
 */

// Get transaction detail (paginated)
router.get(
  "/detail",
  authenticate,
  hasPermission(["laporan:read"]),
  transactionReportController.getTransactionDetail
);

// Get transaction summary
router.get(
  "/summary",
  authenticate,
  hasPermission(["laporan:read"]),
  transactionReportController.getTransactionSummary
);

// Get audit trail
router.get(
  "/audit",
  authenticate,
  hasPermission(["laporan:read"]),
  transactionReportController.getAuditTrail
);

module.exports = router;
