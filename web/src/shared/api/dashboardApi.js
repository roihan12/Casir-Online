import api from './index';

/**
 * Dashboard API Service
 * Endpoints for dashboard data
 */

export const dashboardApi = {
  /**
   * Get main dashboard data
   * Returns: salesSummary, transactionCounts, criticalAlerts, branchPerformance, etc.
   * @param {string} cabangId - Optional branch ID for filtering
   */
  getDashboard: async (cabangId = null) => {
    const params = cabangId ? { cabangId } : {};
    const response = await api.get('/dashboard', { params });
    return response.data;
  },

  /**
   * Get active shift for kasir
   * @param {string} cabangId - Branch ID
   */
  getActiveShift: async (cabangId) => {
    const response = await api.get(`/dashboard/active-shift/${cabangId}`);
    return response.data;
  },

  /**
   * Get transaction dashboard data
   */
  getTransactionDashboard: async (cabangId = null) => {
    const params = cabangId ? { cabangId } : {};
    const response = await api.get('/transaction-dashboard', { params });
    return response.data;
  },
};

export default dashboardApi;
