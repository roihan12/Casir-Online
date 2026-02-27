const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// SALES REPORT ROUTES
// ============================================================================

/**
 * @route GET /api/reports/sales
 * @desc Get sales report with pagination and filters
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional, 'all' for all branches)
 * @query {string} viewType - View type (daily, weekly, monthly)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 50)
 */
router.get("/sales", hasPermission(["laporan:read"]), reportController.getSalesReport);

/**
 * @route GET /api/reports/sales/summary
 * @desc Get sales summary metrics with growth comparison
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/sales/summary", hasPermission(["laporan:read"]), reportController.getSalesSummary);

/**
 * @route GET /api/reports/sales/products
 * @desc Get top selling products
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 * @query {number} limit - Number of products to return (default: 10, max: 100)
 */
router.get("/sales/products", hasPermission(["laporan:read"]), reportController.getTopProducts);

/**
 * @route GET /api/reports/sales/categories
 * @desc Get sales breakdown by category
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/sales/categories", hasPermission(["laporan:read"]), reportController.getSalesByCategory);

// ============================================================================
// FINANCIAL REPORT ROUTES
// ============================================================================

/**
 * @route GET /api/reports/financial/dashboard
 * @desc Get complete financial dashboard data
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/financial/dashboard", hasPermission(["laporan_keuangan:read"]), reportController.getFinancialDashboard);

/**
 * @route GET /api/reports/financial/summary
 * @desc Get financial summary
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/financial/summary", hasPermission(["laporan_keuangan:read"]), reportController.getFinancialSummary);

/**
 * @route GET /api/reports/financial/transactions
 * @desc Get financial transactions list
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} jenisTransaksi - Transaction type (PENJUALAN, PEMBELIAN)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 50)
 */
router.get("/financial/transactions", hasPermission(["laporan_keuangan:read"]), reportController.getFinancialTransactions);

// ============================================================================
// INVENTORY REPORT ROUTES
// ============================================================================

/**
 * @route GET /api/reports/inventory/dashboard
 * @desc Get inventory dashboard data
 * @query {string} cabangId - Branch ID (optional)
 * @query {boolean} includeLowStock - Include only low stock items (default: false)
 */
router.get("/inventory/dashboard", hasPermission(["laporan:read"]), reportController.getInventoryDashboard);

/**
 * @route GET /api/reports/inventory/movements
 * @desc Get inventory movements
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 * @query {string} cabangId - Branch ID (required)
 * @query {string} produkId - Product ID (optional)
 * @query {string} groupBy - Grouping period (day, week, month) (default: day)
 */
router.get("/inventory/movements", hasPermission(["laporan:read"]), reportController.getInventoryMovements);

/**
 * @route GET /api/reports/inventory/low-stock
 * @desc Get low stock products report
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 * @query {string} stokStatus - Stock status (Habis, Menipis) (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get("/inventory/low-stock", hasPermission(["laporan:read"]), reportController.getLowStockReport);

/**
 * @route GET /api/reports/inventory/low-stock/by-category
 * @desc Get low stock summary by category
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/inventory/low-stock/by-category", hasPermission(["laporan:read"]), reportController.getLowStockByCategory);

/**
 * @route GET /api/reports/inventory/expiring
 * @desc Get expiring products report
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 * @query {number} daysThreshold - Days threshold (default: 90)
 * @query {string} statusKadaluarsa - Expiration status (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get("/inventory/expiring", hasPermission(["laporan:read"]), reportController.getExpiringProductsReport);

/**
 * @route GET /api/reports/inventory/expiring/by-category
 * @desc Get expiring products summary by category
 * @query {string} cabangId - Branch ID (optional)
 * @query {number} daysThreshold - Days threshold (default: 90)
 */
router.get("/inventory/expiring/by-category", hasPermission(["laporan:read"]), reportController.getExpiringByCategory);

/**
 * @route GET /api/reports/inventory/stock-transfer
 * @desc Get stock transfer report
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} status - Transfer status (optional)
 * @query {string} dateRange - Date range (today, 7days, 30days, 90days, 6months, 1year) (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get("/inventory/stock-transfer", hasPermission(["laporan:read"]), reportController.getStockTransferReport);

/**
 * @route GET /api/reports/inventory/stock-transfer/by-branch
 * @desc Get stock transfer summary by branch
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} startDate - Start date (YYYY-MM-DD) (optional)
 * @query {string} endDate - End date (YYYY-MM-DD) (optional)
 */
router.get("/inventory/stock-transfer/by-branch", hasPermission(["laporan:read"]), reportController.getStockTransferByBranch);

/**
 * @route GET /api/reports/inventory/health
 * @desc Get inventory health score report
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 * @query {string} healthStatus - Health status (Excellent, Good, Fair, Poor) (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get("/inventory/health", hasPermission(["laporan:read"]), reportController.getInventoryHealthReport);

/**
 * @route GET /api/reports/inventory/health/branch
 * @desc Get branch inventory health summary
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/inventory/health/branch", hasPermission(["laporan:read"]), reportController.getBranchInventoryHealth);

/**
 * @route GET /api/reports/inventory/health/distribution
 * @desc Get health score distribution
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/inventory/health/distribution", hasPermission(["laporan:read"]), reportController.getHealthScoreDistribution);

/**
 * @route GET /api/reports/inventory/health/dimensions
 * @desc Get health score by dimension
 * @query {string} cabangId - Branch ID (optional)
 */
router.get("/inventory/health/dimensions", hasPermission(["laporan:read"]), reportController.getHealthByDimension);

/**
 * @route GET /api/reports/inventory/movement-trends
 * @desc Get stock movement trends
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} produkId - Product ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 * @query {string} startDate - Start date (YYYY-MM-DD) (optional)
 * @query {string} endDate - End date (YYYY-MM-DD) (optional)
 * @query {string} interval - Time interval (day, week, month) (default: day)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get("/inventory/movement-trends", hasPermission(["laporan:read"]), reportController.getStockMovementTrends);

/**
 * @route GET /api/reports/inventory/top-moving
 * @desc Get top moving products
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 * @query {string} startDate - Start date (YYYY-MM-DD) (optional)
 * @query {string} endDate - End date (YYYY-MM-DD) (optional)
 * @query {number} limit - Limit results (default: 10)
 * @query {string} sortBy - Sort by (total, masuk, keluar) (default: total)
 */
router.get("/inventory/top-moving", hasPermission(["laporan:read"]), reportController.getTopMovingProducts);

/**
 * @route GET /api/reports/inventory/movement-category
 * @desc Get stock movement by category
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} startDate - Start date (YYYY-MM-DD) (optional)
 * @query {string} endDate - End date (YYYY-MM-DD) (optional)
 */
router.get("/inventory/movement-category", hasPermission(["laporan:read"]), reportController.getStockMovementByCategory);

/**
 * @route GET /api/reports/inventory/value-category
 * @desc Get inventory value by category
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} kategoriId - Category ID (optional)
 */
router.get("/inventory/value-category", hasPermission(["laporan:read"]), reportController.getInventoryValueByCategory);

/**
 * @route GET /api/reports/inventory/activities
 * @desc Get recent inventory activities
 * @query {string} cabangId - Branch ID (optional)
 * @query {string} produkId - Product ID (optional)
 * @query {string} referenceType - Reference type (optional)
 * @query {string} userId - User ID (optional)
 * @query {string} startDate - Start date (YYYY-MM-DD) (optional)
 * @query {string} endDate - End date (YYYY-MM-DD) (optional)
 * @query {number} limit - Limit results (default: 50)
 */
router.get("/inventory/activities", hasPermission(["laporan:read"]), reportController.getRecentInventoryActivities);

// ============================================================================
// BRANCH REPORT ROUTES
// ============================================================================

/**
 * @route GET /api/reports/branch
 * @desc Get branch comparison data
 * @query {string} startDate - Start date (YYYY-MM-DD)
 * @query {string} endDate - End date (YYYY-MM-DD)
 */
router.get("/branch", hasPermission(["laporan:read"]), reportController.getBranchComparison);

module.exports = router;
