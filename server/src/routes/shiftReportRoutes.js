const express = require("express");
const router = express.Router();
const shiftReportController = require("../controllers/shiftReportController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

/**
 * Shift Report Routes
 * All routes require authentication and report:read permission
 */

// Get shift summary
router.get(
  "/summary",
  authenticate,
  hasPermission(["report:read"]),
  shiftReportController.getShiftSummary
);

// Get shift detail
router.get(
  "/detail/:shiftId",
  authenticate,
  hasPermission(["report:read"]),
  shiftReportController.getShiftDetail
);

// Get cash variance report
router.get(
  "/cash-report",
  authenticate,
  hasPermission(["report:read"]),
  shiftReportController.getCashReport
);

// Get staff performance
router.get(
  "/staff-performance",
  authenticate,
  hasPermission(["report:read"]),
  shiftReportController.getStaffPerformance
);

module.exports = router;
