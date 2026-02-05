const reportService = require("../services/reportService");
const FinancialReportService = require("../services/financialReportService");
const lowStockReportService = require("../services/lowStockReportService");
const expiringProductsReportService = require("../services/expiringProductsReportService");
const stockTransferReportService = require("../services/stockTransferReportService");
const inventoryHealthReportService = require("../services/inventoryHealthReportService");
const stockMovementTrendsReportService = require("../services/stockMovementTrendsReportService");
const { ResponseError } = require("../error/responseError");
const {
  getSalesReportSchema,
  getSalesSummarySchema,
  getTopProductsSchema,
  getSalesByCategorySchema,
  getFinancialDashboardSchema,
  getFinancialSummarySchema,
  getFinancialTransactionsSchema,
  getInventoryDashboardSchema,
  getInventoryMovementsSchema,
  getBranchComparisonSchema,
} = require("../validation/reportValidation");
const { sanitizeBigInt } = require("../utils/bigintSerializer");

/**
 * ============================================
 * SALES REPORT CONTROLLERS
 * ============================================
 */

/**
 * Get sales report with pagination
 */
const getSalesReport = async (req, res, next) => {
  try {
    const validatedData = getSalesReportSchema.parse(req.query);
    const data = await reportService.getSalesReport(validatedData);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales summary metrics
 */
const getSalesSummary = async (req, res, next) => {
  try {
    const validatedData = getSalesSummarySchema.parse(req.query);
    const data = await reportService.getSalesSummary(validatedData);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling products
 */
const getTopProducts = async (req, res, next) => {
  try {
    const validatedData = getTopProductsSchema.parse(req.query);
    const data = await reportService.getTopProducts(validatedData);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by category
 */
const getSalesByCategory = async (req, res, next) => {
  try {
    const validatedData = getSalesByCategorySchema.parse(req.query);
    const data = await reportService.getSalesByCategory(validatedData);

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * FINANCIAL REPORT CONTROLLERS
 * ============================================
 */

/**
 * Get financial dashboard data
 */
const getFinancialDashboard = async (req, res, next) => {
  try {
    const validatedData = getFinancialDashboardSchema.parse(req.query);

    const dashboardData = await FinancialReportService.getFinancialDashboard(validatedData);

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial summary
 */
const getFinancialSummary = async (req, res, next) => {
  try {
    const validatedData = getFinancialSummarySchema.parse(req.query);

    const summaryData = await FinancialReportService.getFinancialSummary(validatedData);

    res.json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial transactions list
 */
const getFinancialTransactions = async (req, res, next) => {
  try {
    const validatedData = getFinancialTransactionsSchema.parse(req.query);

    const transactionsData = await FinancialReportService.getDetailedTransactions(validatedData);

    res.json({
      success: true,
      ...transactionsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * INVENTORY REPORT CONTROLLERS
 * ============================================
 */

/**
 * Get inventory dashboard data
 */
const getInventoryDashboard = async (req, res, next) => {
  try {
    const validatedData = getInventoryDashboardSchema.parse(req.query);

    const dashboardData = await reportService.getInventoryDashboard(validatedData);

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory movements
 */
const getInventoryMovements = async (req, res, next) => {
  try {
    const validatedData = getInventoryMovementsSchema.parse(req.query);

    const movementsData = await reportService.getInventoryMovements(validatedData);

    res.json({
      success: true,
      data: movementsData,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const data = await lowStockReportService.getLowStockReport(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockByCategory = async (req, res, next) => {
  try {
    const data = await lowStockReportService.getLowStockByCategory(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getExpiringProductsReport = async (req, res, next) => {
  try {
    const data = await expiringProductsReportService.getExpiringProductsReport(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getExpiringByCategory = async (req, res, next) => {
  try {
    const data = await expiringProductsReportService.getExpiringByCategory(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getStockTransferReport = async (req, res, next) => {
  try {
    const data = await stockTransferReportService.getStockTransferReport(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getStockTransferByBranch = async (req, res, next) => {
  try {
    const data = await stockTransferReportService.getStockTransferByBranch(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryHealthReport = async (req, res, next) => {
  try {
    const data = await inventoryHealthReportService.getInventoryHealthReport(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getBranchInventoryHealth = async (req, res, next) => {
  try {
    const data = await inventoryHealthReportService.getBranchInventoryHealth(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getHealthScoreDistribution = async (req, res, next) => {
  try {
    const data = await inventoryHealthReportService.getHealthScoreDistribution(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getHealthByDimension = async (req, res, next) => {
  try {
    const data = await inventoryHealthReportService.getHealthByDimension(req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getStockMovementTrends = async (req, res, next) => {
  try {
    const data = await stockMovementTrendsReportService.getStockMovementTrends(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getTopMovingProducts = async (req, res, next) => {
  try {
    const data = await stockMovementTrendsReportService.getTopMovingProducts(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getStockMovementByCategory = async (req, res, next) => {
  try {
    const data = await stockMovementTrendsReportService.getStockMovementByCategory(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryValueByCategory = async (req, res, next) => {
  try {
    const data = await stockMovementTrendsReportService.getInventoryValueByCategory(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getRecentInventoryActivities = async (req, res, next) => {
  try {
    const data = await stockMovementTrendsReportService.getRecentInventoryActivities(req.query);
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * BRANCH REPORT CONTROLLERS
 * ============================================
 */

/**
 * Get branch comparison data
 */
const getBranchComparison = async (req, res, next) => {
  try {
    const validatedData = getBranchComparisonSchema.parse(req.query);

    const comparisonData = await reportService.getBranchComparison(validatedData);

    res.json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Sales report
  getSalesReport,
  getSalesSummary,
  getTopProducts,
  getSalesByCategory,

  // Financial report
  getFinancialDashboard,
  getFinancialSummary,
  getFinancialTransactions,

  // Inventory report
  getInventoryDashboard,
  getInventoryMovements,
  getLowStockReport,
  getLowStockByCategory,
  getExpiringProductsReport,
  getExpiringByCategory,
  getStockTransferReport,
  getStockTransferByBranch,
  getInventoryHealthReport,
  getBranchInventoryHealth,
  getHealthScoreDistribution,
  getHealthByDimension,
  getStockMovementTrends,
  getTopMovingProducts,
  getStockMovementByCategory,
  getInventoryValueByCategory,
  getRecentInventoryActivities,

  // Branch report
  getBranchComparison,
};
