const express = require("express");
const router = express.Router();
const reportExportController = require("../controllers/reportExportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/reports/export/sales
 * @desc Export sales report
 * @query {string} format - Export format (excel, pdf, csv)
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional, 'all' for all branches)
 */
router.get(
  "/sales",
  hasPermission(["report:read"]),
  reportExportController.exportSalesReport
);

/**
 * @route GET /api/reports/export/financial
 * @desc Export financial report
 * @query {string} format - Export format (excel, pdf, csv)
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional, 'all' for all branches)
 */
router.get(
  "/financial",
  hasPermission(["report:read"]),
  reportExportController.exportFinancialReport
);

/**
 * @route GET /api/reports/export/inventory
 * @desc Export inventory report
 * @query {string} format - Export format (excel, pdf, csv)
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional, 'all' for all branches)
 */
router.get(
  "/inventory",
  hasPermission(["report:read"]),
  reportExportController.exportInventoryReport
);

/**
 * @route GET /api/reports/export/branch
 * @desc Export branch comparison report
 * @query {string} format - Export format (excel, pdf, csv)
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 */
router.get(
  "/branch",
  hasPermission(["report:read"]),
  reportExportController.exportBranchReport
);

module.exports = router;
