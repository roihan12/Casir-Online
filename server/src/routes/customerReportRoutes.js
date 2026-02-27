const express = require("express");
const router = express.Router();
const customerReportController = require("../controllers/customerReportController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

/**
 * Customer & Loyalty Report Routes
 * All routes require authentication and report:read permission
 */

// Get customer summary
router.get(
  "/summary",
  authenticate,
  hasPermission(["laporan:read"]),
  customerReportController.getCustomerSummary
);

// Get top customers
router.get(
  "/top",
  authenticate,
  hasPermission(["laporan:read"]),
  customerReportController.getTopCustomers
);

// Get loyalty metrics
router.get(
  "/loyalty",
  authenticate,
  hasPermission(["laporan:read"]),
  customerReportController.getLoyaltyReport
);

// Get customer acquisition
router.get(
  "/acquisition",
  authenticate,
  hasPermission(["laporan:read"]),
  customerReportController.getCustomerAcquisition
);

module.exports = router;
