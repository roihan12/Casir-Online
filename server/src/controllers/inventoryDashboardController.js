const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  getInventoryDashboardValidation,
} = require("../validation/inventoryDashboardValidation");
const inventoryDashboardService = require("../services/inventoryDashboardService");
const { sanitizeBigInt, bigIntReplacer } = require("../utils/bigintSerializer");

/**
 * Controller untuk mendapatkan semua data dashboard inventory
 */
const getInventoryDashboardData = async (req, res, next) => {
  try {
    const request = validate(getInventoryDashboardValidation, {
      cabangId: req.query.cabangId,
      period: req.query.period || "30", // Default 30 hari
    });

    // Get user information
    const userId = req.user.id;

    // Fetch dashboard data from service
    const dashboardData =
      await inventoryDashboardService.getInventoryDashboardData(
        request.cabangId,
        parseInt(request.period)
      );

    res.status(200).json({
      status: true,
      message: "Inventory dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};


const getInventoryNewDashboardData = async (req, res, next) => {
  try {
    const request = validate(getInventoryDashboardValidation, {
      cabangId: req.query.cabangId,
      period: req.query.period || "7days", // Default 30 hari
    });

    // Get user information
    const userId = req.user.id;

    // Fetch dashboard data from service
    const dashboardData =
      await inventoryDashboardService.inventoryNewDashboardData(
        request.cabangId,
        request.period
      );

    res.status(200).json({
      status: true,
      message: "Inventory dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan produk dengan stok rendah
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const { cabangId, period = '30days', page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers and validate
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.min(Math.max(1, parseInt(limit) || 10), 100); // Cap at 100 items per page

    // Call service to get low stock products with pagination
    const result = await inventoryDashboardService.getLowStockProducts(
      cabangId,
      period,
      pageNumber,
      limitNumber
    );

    res.status(200).json({
      status: true,
      message: "Low stock products retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan data pergerakan stok
 */
const getStockMovementData = async (req, res, next) => {
  try {
    const { cabangId, period = 30, interval = 'day' } = req.query;

    // Call service to get stock movement data
    const stockMovementData =
      await inventoryDashboardService.getStockMovementData(cabangId, period, interval);

    res.status(200).json({
      status: true,
      message: "Stock movement data retrieved successfully",
      data: stockMovementData,
    });
  } catch (error) {
    next(error);
  }
};


const getHighStockMovementData = async (req, res, next) => {
  try {
    const { cabangId, period = 30, interval = 'day' } = req.query;

    // Call service to get stock movement data
    const stockMovementData =
      await inventoryDashboardService.getHighStockMovementData(cabangId, period, interval);

    res.status(200).json({
      status: true,
      message: "Stock movement data retrieved successfully",
      data: stockMovementData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan nilai inventori
 */
const getStockValue = async (req, res, next) => {
  try {
    const { cabangId } = req.query;

    // Call service to get stock value
    const stockValue = await inventoryDashboardService.getStockValue(cabangId);

    res.status(200).json({
      status: true,
      message: "Stock value retrieved successfully",
      data: stockValue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan data transfer antar cabang
 */
const getBranchTransferData = async (req, res, next) => {
  try {
    const { cabangId, period = 7 } = req.query;

    // Call service to get branch transfer data
    const branchTransferData =
      await inventoryDashboardService.getBranchTransferData(cabangId, period);

    res.status(200).json({
      status: true,
      message: "Branch transfer data retrieved successfully",
      data: branchTransferData,
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Controller untuk mendapatkan aktivitas inventori terbaru
 */
const getInventoryActivities = async (req, res, next) => {
  try {
    const { cabangId, limit = 50 } = req.query;

    // Call service to get inventory activities
    const activities = await inventoryDashboardService.getInventoryActivities(
      cabangId,
      parseInt(limit)
    );

    res.status(200).json({
      status: true,
      message: "Inventory activities retrieved successfully",
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan nilai inventori berdasarkan kategori
 */
const getInventoryValueByCategory = async (req, res, next) => {
  try {
    const { cabangId } = req.query;

    // Call service to get inventory value by category
    const inventoryValue = await inventoryDashboardService.getInventoryValueByCategory(cabangId);

    res.status(200).json({
      status: true,
      message: "Inventory value by category retrieved successfully",
      data: inventoryValue,
    });
  } catch (error) {
    next(error);
  }
};


const getInventoryHealthScore = async (req, res, next) => {
  try {
    const { cabangId } = req.query;

    // Call service to get inventory health score
    const inventoryHealthScore = await inventoryDashboardService.getInventoryHealthScore(cabangId);

    res.status(200).json({
      status: true,
      message: "Inventory health score retrieved successfully",
      data: inventoryHealthScore,
    });
  } catch (error) {
    next(error);
  }
};


const getStockKadaluwarsa = async (req, res, next) => {
  try {
    const { cabangId, period = '30days', page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers and validate
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.min(Math.max(1, parseInt(limit) || 10), 100);

    // Call service to get stockkadaluwarsa
    const stockKadaluwarsa = await inventoryDashboardService.getStockKadaluwarsa(cabangId, period, pageNumber, limitNumber);

    res.status(200).json({
      status: true,
      message: "Stock kadaluwarsa retrieved successfully",
      data: stockKadaluwarsa.data,
      pagination: stockKadaluwarsa.pagination,
    });
  } catch (error) {
    next(error);
  }
}
  

module.exports = {
  getInventoryDashboardData,
  getLowStockProducts,
  getStockMovementData,
  getStockValue,
  getBranchTransferData,
  getInventoryNewDashboardData,
  getInventoryActivities,
  getInventoryValueByCategory,
  getHighStockMovementData,
  getInventoryHealthScore,
  getStockKadaluwarsa,
};
