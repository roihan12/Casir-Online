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
  hasPermission(["report:read"]),
  financialReportController.getFinancialDashboard
);

// Get financial summary data
router.get(
  "/summary",
  hasPermission(["report:read"]),
  financialReportController.getFinancialSummary
);

// Get financial trend data
router.get(
  "/trend",
  hasPermission(["report:read"]),
  financialReportController.getFinancialTrend
);

// Get payment method summary
router.get(
  "/payment-methods",
  hasPermission(["report:read"]),
  financialReportController.getPaymentMethodSummary
);

// Get expense analysis by category
router.get(
  "/expenses",
  hasPermission(["report:read"]),
  financialReportController.getExpenseAnalysis
);

// Get tax and fees summary
router.get(
  "/tax-and-fees",
  hasPermission(["report:read"]),
  financialReportController.getTaxAndFeesSummary
);

// Get detailed financial transactions
router.get(
  "/transactions",
  hasPermission(["report:read"]),
  financialReportController.getDetailedTransactions
);

// Get profit and loss report
router.get(
  "/profit-loss",
  hasPermission(["report:read"]),
  financialReportController.getProfitLossReport
);

// Get profit and loss summary with comparisons
router.get(
  "/profit-loss-summary",
  hasPermission(["report:read"]),
  financialReportController.getProfitLossSummary
);

// Manually refresh materialized views
router.post(
  "/refresh-views",
  hasPermission(["report:manage"]),
  financialReportController.refreshMaterializedViews
);

module.exports = router;
