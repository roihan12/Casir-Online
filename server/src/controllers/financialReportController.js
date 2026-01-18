const FinancialReportService = require("../services/financialReportService");
const { ResponseError } = require("../error/responseError");

/**
 * Controller for getting the overall financial dashboard data
 */
const getFinancialDashboard = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "Start date and end date are required");
    }

    const dashboardData = await FinancialReportService.getFinancialDashboard(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Financial dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting financial summary data
 */
const getFinancialSummary = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "Start date and end date are required");
    }

    const summaryData = await FinancialReportService.getFinancialSummary(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Financial summary data retrieved successfully",
      data: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting financial trend data
 */
const getFinancialTrend = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "Start date and end date are required");
    }

    const trendData = await FinancialReportService.getFinancialDailyTrend(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Financial trend data retrieved successfully",
      data: trendData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting payment method summary
 */
const getPaymentMethodSummary = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "Start date and end date are required");
    }

    const paymentData = await FinancialReportService.getPaymentMethodSummary(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Payment method summary retrieved successfully",
      data: paymentData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting expense analysis by category
 */
const getExpenseAnalysis = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
    };

    const expenseData = await FinancialReportService.getExpenseAnalysis(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Expense analysis data retrieved successfully",
      data: expenseData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting tax and fees summary
 */
const getTaxAndFeesSummary = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
    };

    const taxData = await FinancialReportService.getTaxAndFeesSummary(filters);

    res.status(200).json({
      status: true,
      message: "Tax and fees summary retrieved successfully",
      data: taxData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting detailed financial transactions
 */
const getDetailedTransactions = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      jenisTransaksi: req.query.jenisTransaksi,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "Start date and end date are required");
    }

    const transactionData =
      await FinancialReportService.getDetailedTransactions(filters);

    res.status(200).json({
      status: true,
      message: "Detailed transaction data retrieved successfully",
      data: transactionData.data,
      pagination: transactionData.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting profit and loss report
 */
const getProfitLossReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      year: req.query.year,
      month: req.query.month,
    };

    // Validate year
    if (!filters.year) {
      throw new ResponseError(400, "Year parameter is required");
    }

    const profitLossData = await FinancialReportService.getProfitLossReport(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Profit and loss report retrieved successfully",
      data: profitLossData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for getting profit and loss summary with comparisons
 */
const getProfitLossSummary = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || "all",
      period: req.query.period || "month",
    };

    // Validate period type
    if (!["month", "quarter", "year"].includes(filters.period)) {
      throw new ResponseError(
        400,
        "Invalid period type. Must be 'month', 'quarter', or 'year'"
      );
    }

    const summaryData = await FinancialReportService.getProfitLossSummary(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Profit and loss summary retrieved successfully",
      data: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for manually refreshing the materialized views
 */
const refreshMaterializedViews = async (req, res, next) => {
  try {
    const { viewType = "all" } = req.query;

    // Validate viewType parameter
    if (!["selective", "full", "all"].includes(viewType)) {
      throw new ResponseError(
        400,
        "Invalid viewType parameter. Must be 'selective', 'full', or 'all'"
      );
    }

    const result = await FinancialReportService.refreshMaterializedViews(
      viewType
    );

    if (!result.success) {
      throw new ResponseError(500, result.message);
    }

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialDashboard,
  getFinancialSummary,
  getFinancialTrend,
  getPaymentMethodSummary,
  getExpenseAnalysis,
  getTaxAndFeesSummary,
  getDetailedTransactions,
  getProfitLossReport,
  getProfitLossSummary,
  refreshMaterializedViews,
};
