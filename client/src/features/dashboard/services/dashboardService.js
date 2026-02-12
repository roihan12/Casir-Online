import api from "@common/utils/api";

/**
 * Dashboard Service - Handles all dashboard-related API calls.
 */

/**
 * Get comprehensive dashboard data.
 * @param {string|null} selectedBranchId - Branch ID to filter data, or null/'all' for global view.
 * @returns {Promise<Object>} Dashboard data object.
 */
export const getDashboardData = async (selectedBranchId = null) => {
  try {
    let queryParams = "";
    if (selectedBranchId && selectedBranchId !== "all") {
      queryParams = `?cabangId=${selectedBranchId}`;
    }

    const response = await api.get(`/dashboard${queryParams}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    // Check if it's a BigInt serialization error
    if (error?.response?.data?.message?.includes("BigInt")) {
      throw new Error(
        "Terjadi kesalahan saat memproses data (BigInt error). Silakan coba lagi."
      );
    }

    throw error.response?.data?.message || "Failed to fetch dashboard data";
  }
};

/**
 * Get active shift for a specific branch.
 * @param {string} cabangId - Branch ID.
 * @returns {Promise<Object>} Active shift data.
 */
export const getActiveShift = async (cabangId) => {
  try {
    const response = await api.get(`/dashboard/shift?cabangId=${cabangId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching active shift:", error);
    throw error.response?.data?.message || "Failed to fetch active shift";
  }
};

export default {
  getDashboardData,
  getActiveShift,
};
