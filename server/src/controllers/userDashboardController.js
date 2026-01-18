const userDashboardService = require("../services/userDashboardService");

/**
 * Controller untuk mendapatkan data dashboard user
 */
const getUserDashboard = async (req, res) => {
  try {
    const dashboardData = await userDashboardService.getUserDashboardData();

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
    const stats = await userDashboardService.getUserStats();

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
    const distribution = await userDashboardService.getRoleDistribution();

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
    const usersPerCabang = await userDashboardService.getUsersPerCabang();

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
    const breakdown = await userDashboardService.getBreakdownUserPerCabang();

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
    const recentLogins = await userDashboardService.getRecentLogins();

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
    const [activities, statistics] = await Promise.all([
      userDashboardService.getUserActivities(),
      userDashboardService.getActivityStatistics(),
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
    const performance = await userDashboardService.getUserPerformance();

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
    const activeAdmins = await userDashboardService.getActiveAdminCabang();

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
