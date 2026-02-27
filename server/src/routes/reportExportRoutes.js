const express = require("express");
const router = express.Router();
const reportExportController = require("../controllers/reportExportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/reports/export/:reportType
 * @desc Unified Streaming Export
 * @query {string} format - Export format (excel, pdf, csv)
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional, 'all' for all branches)
 */
router.get(
  "/:reportType",
  hasPermission(["laporan:read"]),
  reportExportController.exportReportUnified,
  reportExportController.exportBranchReport
);

module.exports = router;
