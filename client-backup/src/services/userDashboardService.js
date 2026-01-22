import api from "./api";

/**
 * Get complete user dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
export const getUserDashboardData = async () => {
  try {
    const response = await api.get("/user-dashboard");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    throw (
      error.response?.data?.message || "Failed to fetch user dashboard data"
    );
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async () => {
  try {
    const response = await api.get("/user-dashboard/stats");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw error.response?.data?.message || "Failed to fetch user statistics";
  }
};

/**
 * Get role distribution
 * @returns {Promise<Array>} Role distribution
 */
export const getRoleDistribution = async () => {
  try {
    const response = await api.get("/user-dashboard/role-distribution");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching role distribution:", error);
    throw error.response?.data?.message || "Failed to fetch role distribution";
  }
};

/**
 * Get recent login activities
 * @returns {Promise<Array>} Recent logins
 */
export const getRecentLogins = async () => {
  try {
    const response = await api.get("/user-dashboard/recent-logins");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching recent logins:", error);
    throw error.response?.data?.message || "Failed to fetch recent logins";
  }
};

/**
 * Get user activities
 * @returns {Promise<Object>} User activities
 */
export const getUserActivities = async () => {
  try {
    const response = await api.get("/user-dashboard/activities");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user activities:", error);
    throw error.response?.data?.message || "Failed to fetch user activities";
  }
};

/**
 * Get users per cabang
 * @returns {Promise<Array>} Users per cabang
 */
export const getUsersPerCabang = async () => {
  try {
    const response = await api.get("/user-dashboard/users-per-cabang");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching users per cabang:", error);
    throw error.response?.data?.message || "Failed to fetch users per cabang";
  }
};

/**
 * Get user performance (kasir)
 * @returns {Promise<Object>} User performance data
 */
export const getUserPerformance = async () => {
  try {
    const response = await api.get("/user-dashboard/user-performance");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user performance:", error);
    throw error.response?.data?.message || "Failed to fetch user performance";
  }
};

/**
 * Get active admin cabang
 * @returns {Promise<Array>} Active admin cabang
 */
export const getActiveAdminCabang = async () => {
  try {
    const response = await api.get("/user-dashboard/active-admin-cabang");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching active admin cabang:", error);
    throw (
      error.response?.data?.message || "Failed to fetch active admin cabang"
    );
  }
};

export default {
  getUserDashboardData,
  getUserStats,
  getRoleDistribution,
  getRecentLogins,
  getUserActivities,
  getUsersPerCabang,
  getUserPerformance,
  getActiveAdminCabang,
};
