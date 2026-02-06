const express = require("express");
const router = express.Router();
const financialReportController = require("../controllers/financialReportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get complete financial dashboard data
router.get(
  "/dashboard",
  hasPermission(["laporan:read"]),
  financialReportController.getFinancialDashboard
);

// Get financial summary data
router.get(
  "/summary",
  hasPermission(["laporan:read"]),
  financialReportController.getFinancialSummary
);

// Get financial trend data
router.get(
  "/trend",
  hasPermission(["laporan:read"]),
  financialReportController.getFinancialTrend
);

// Get payment method summary
router.get(
  "/payment-methods",
  hasPermission(["laporan:read"]),
  financialReportController.getPaymentMethodSummary
);

// Get expense analysis by category
router.get(
  "/expenses",
  hasPermission(["laporan:read"]),
  financialReportController.getExpenseAnalysis
);

// Get tax and fees summary
router.get(
  "/tax-and-fees",
  hasPermission(["laporan:read"]),
  financialReportController.getTaxAndFeesSummary
);

// Get detailed financial transactions
router.get(
  "/transactions",
  hasPermission(["laporan:read"]),
  financialReportController.getDetailedTransactions
);

// Get profit and loss report
router.get(
  "/profit-loss",
  hasPermission(["laporan:read"]),
  financialReportController.getProfitLossReport
);

// Get profit and loss summary with comparisons
router.get(
  "/profit-loss-summary",
  hasPermission(["laporan:read"]),
  financialReportController.getProfitLossSummary
);

// Manually refresh materialized views
router.post(
  "/refresh-views",
  hasPermission(["laporan:manage"]),
  financialReportController.refreshMaterializedViews
);

module.exports = router;
