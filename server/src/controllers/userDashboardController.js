const userDashboardService = require("../services/userDashboardService");

/**
 * Controller untuk mendapatkan data dashboard user
 */
const getUserDashboard = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const dashboardData = await userDashboardService.getUserDashboardData(cabangId);

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error getting user dashboard:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get user dashboard data",
    });
  }
};

/**
 * Controller untuk mendapatkan statistik user
 */
const getUserStats = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const stats = await userDashboardService.getUserStats(cabangId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get user statistics",
    });
  }
};

/**
 * Controller untuk mendapatkan distribusi role user
 */
const getRoleDistribution = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const distribution = await userDashboardService.getRoleDistribution(
      cabangId
    );

    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Error getting role distribution:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get role distribution",
    });
  }
};

/**
 * Controller untuk mendapatkan jumlah user per cabang
 */
const getUsersPerCabang = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const usersPerCabang = await userDashboardService.getUsersPerCabang(
      cabangId
    );

    return res.status(200).json({
      success: true,
      data: usersPerCabang,
    });
  } catch (error) {
    console.error("Error getting users per cabang:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get users per cabang",
    });
  }
};

/**
 * Controller untuk mendapatkan breakdown user per cabang
 */
const getBreakdownUserPerCabang = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const breakdown = await userDashboardService.getBreakdownUserPerCabang(
      cabangId
    );

    return res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error("Error getting breakdown per cabang:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get breakdown per cabang",
    });
  }
};

/**
 * Controller untuk mendapatkan login terbaru
 */
const getRecentLogins = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const recentLogins = await userDashboardService.getRecentLogins(cabangId);

    return res.status(200).json({
      success: true,
      data: recentLogins,
    });
  } catch (error) {
    console.error("Error getting recent logins:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get recent logins",
    });
  }
};

/**
 * Controller untuk mendapatkan aktivitas user
 */
const getUserActivities = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const [activities, statistics] = await Promise.all([
      userDashboardService.getUserActivities(cabangId),
      userDashboardService.getActivityStatistics(cabangId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recentActivities: activities,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error getting user activities:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get user activities",
    });
  }
};

/**
 * Controller untuk mendapatkan performa user (kasir)
 */
const getUserPerformance = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const performance = await userDashboardService.getUserPerformance(cabangId);

    return res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error getting user performance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get user performance",
    });
  }
};

/**
 * Controller untuk mendapatkan admin cabang teraktif
 */
const getActiveAdminCabang = async (req, res) => {
  try {
    const { cabangId } = req.query;
    const activeAdmins = await userDashboardService.getActiveAdminCabang(
      cabangId
    );

    return res.status(200).json({
      success: true,
      data: activeAdmins,
    });
  } catch (error) {
    console.error("Error getting active admin cabang:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get active admin cabang",
    });
  }
};

module.exports = {
  getUserDashboard,
  getUserStats,
  getRoleDistribution,
  getUsersPerCabang,
  getBreakdownUserPerCabang,
  getRecentLogins,
  getUserActivities,
  getUserPerformance,
  getActiveAdminCabang,
};
