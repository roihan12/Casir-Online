const DashboardService = require("../services/dashboardService");
const { logger } = require("../utils/logger");

const dashboardController = {
  // Get user's profile and accessible dashboard
  getUserDashboard: async (req, res, next) => {
    try {
      // const userId = req.user.id;
      const selectedBranchId = req.query.cabangId || null;

      const result = await DashboardService.getDashboardData(
        req.user,
        selectedBranchId
      );

      res.status(200).json({
        status: true,
        message: "Dashboard Data",
        data: result,
      });
    } catch (error) {
      // Log the actual error for debugging with full context
      logger.error("Dashboard Error", {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        selectedBranchId: req.query.cabangId,
      });
      next(error);
    }
  },

  // Get active shift for kasir
  getActiveShift: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const cabangId = req.params.cabangId;

      const activeShift = await DashboardService.getActiveShift(
        userId,
        cabangId
      );

      if (!activeShift) {
        return res.status(404).json({
          status: false,
          message: "No active shift found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Active Shift",
        data: activeShift,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = dashboardController;
