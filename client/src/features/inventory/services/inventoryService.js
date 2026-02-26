import api from "@common/utils/api";

/**
 * Service for handling inventory-related API calls
 */
const inventoryService = {
  /**
   * Get inventory dashboard data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {Promise<Object>} Dashboard data
   */
  getDashboardData: async (cabangId, period = 30) => {
    const params = new URLSearchParams();
    // Only append cabangId if it's not 'all' or if it is 'all', explicitly pass it
    // This ensures the backend knows when to fetch aggregated data
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);

    const response = await api.get(`/inventory-dashboard?${params}`);
    return response.data.data;
  },

  getStockKadaluwarsa: async (cabangId, period = 30, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const response = await api.get(`/inventory-dashboard/stock-kadaluwarsa?${params}`);
    return response.data.data;
  },

  getHighStockMovementsTrends: async (cabangId, period = 30) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);

    const response = await api.get(`/inventory-dashboard/high-stock-movement?${params}`);
    return response.data.data;
  },

  getInventoryHealthScore: async (cabangId) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);

    const response = await api.get(`/inventory-dashboard/inventory-health-score?${params}`);
    return response.data.data;
  },

  /**
   * Get low stock products
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Promise<Array>} List of low stock products
   */
  getLowStockProducts: async (cabangId, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const response = await api.get(`/inventory-dashboard/low-stock?${params}`);
    return response.data;
  },

  /**
   * Get stock movement data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number|string} period - Time period in days or format like '30days'
   * @param {string} interval - Interval for grouping data ('day', 'week', 'month')
   * @returns {Promise<Object>} Stock movement data including trends and top products
   */
  getStockMovementData: async (cabangId, period = 30, interval = 'day') => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);
    if (interval) params.append("interval", interval);

    const response = await api.get(
      `/inventory-dashboard/stock-movement?${params}`
    );
    return response.data.data;
  },

  /**
   * Get branch transfer data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {Promise<Object>} Branch transfer data
   */
  getBranchTransferData: async (cabangId, period = 30) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);

    const response = await api.get(
      `/inventory-dashboard/branch-transfer?${params}`
    );
    return response.data.data;
  },

  /**
   * Get stock value data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {Promise<Object>} Stock value data
   */
  getStockValue: async (cabangId) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);

    const response = await api.get(
      `/inventory-dashboard/stock-value?${params}`
    );
    return response.data.data;
  },

  /**
   * Get comprehensive inventory dashboard data from the new endpoint
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {Promise<Object>} Comprehensive dashboard data including:
   * - Low stock products overview by branch
   * - Expiring products summary by urgency level
   * - Branch transfer activity
   * - Branch transfer balance (sent vs received)
   * - Top products with critical stock levels
   * - Top products nearing expiration
   * - Recent transfer activity timeline
   * - Monthly inventory transfer trends
   * - Inventory health score by branch
   */
  getComprehensiveDashboardData: async (cabangId, period = 30) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (period) params.append("period", period);

    const response = await api.get(`/inventory-dashboard/new?${params}`);
    return response.data.data;
  },

  /**
   * Adjust stock for a product
   * @param {Object} adjustmentData - Stock adjustment data
   * @returns {Promise<Object>} Adjustment result
   */
  adjustStock: async (adjustmentData) => {
    const response = await api.post("/inventory/adjustments", adjustmentData);
    return response.data;
  },

  /**
   * Create a stock adjustment
   * @param {Object} adjustmentData - Stock adjustment data
   * @returns {Promise<Object>} Adjustment result
   */
  createStockAdjustment: async (adjustmentData) => {
    const response = await api.post("/inventory/adjustments", adjustmentData);
    return response.data;
  },

  /**
   * Get inventory movements history
   * @param {Object} params - Query parameters
   * @param {string} params.cabangId - Branch ID
   * @param {string} params.produkId - Product ID (optional)
   * @param {string} params.startDate - Start date (optional)
   * @param {string} params.endDate - End date (optional)
   * @param {string} params.type - Movement type (optional)
   * @param {number} params.page - Page number (optional)
   * @param {number} params.limit - Items per page (optional)
   * @returns {Promise<Object>} Movements data with pagination
   */
  getInventoryMovements: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all provided parameters to the query
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const response = await api.get(`/inventory/movements?${queryParams}`);
    return response.data;
  },

  /**
   * Record a new inventory movement
   * @param {Object} movementData - Movement data to record
   * @param {string} movementData.cabangId - Branch ID
   * @param {string} movementData.produkId - Product ID
   * @param {string} movementData.type - Movement type ('in', 'out', 'adjustment', 'transfer')
   * @param {number} movementData.quantity - Quantity moved
   * @param {number} movementData.stockBefore - Stock before movement (optional)
   * @param {number} movementData.stockAfter - Stock after movement (optional)
   * @param {string} movementData.reason - Reason for movement (optional)
   * @param {string} movementData.reference - Reference document/number (optional)
   * @param {string} movementData.batchNumber - Batch number (optional)
   * @returns {Promise<Object>} Recorded movement data
   */
  recordMovement: async (movementData) => {
    const response = await api.post("/inventory/movements", movementData);
    return response.data;
  },

  /**
   * Delete an inventory movement (admin only)
   * @param {string} movementId - ID of the movement to delete
   * @returns {Promise<Object>} Deletion result
   */
  deleteMovement: async (movementId) => {
    const response = await api.delete(`/inventory/movements/${movementId}`);
    return response.data;
  },

  /**
   * Export inventory movements to CSV
   * @param {Object} params - Query parameters for filtering the export
   * @returns {Promise<Blob>} CSV file as blob
   */
  exportMovements: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all provided parameters to the query
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const response = await api.get(
      `/inventory/movements/export?${queryParams}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  /**
   * Generate PDF report for inventory movements
   * @param {Object} params - Query parameters for filtering the report
   * @param {string} params.cabangId - Branch ID (optional)
   * @param {string} params.produkId - Product ID (optional)
   * @param {string} params.startDate - Start date (optional)
   * @param {string} params.endDate - End date (optional)
   * @param {string} params.type - Movement type (optional)
   * @param {string} params.format - Report format ('detailed', 'summary', 'batch', default: 'detailed')
   * @param {string} params.outputType - Output file type ('pdf', 'excel', 'csv', default: 'pdf')
   * @returns {Promise<Blob>} Report file as blob
   */
  generateMovementReport: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all provided parameters to the query
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    // Default to PDF if no output type specified
    const outputType = params.outputType || "pdf";

    // Set appropriate response type and file extension based on output type
    let responseType;
    switch (outputType) {
      case "excel":
        responseType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "csv":
        responseType = "text/csv";
        break;
      case "pdf":
      default:
        responseType = "application/pdf";
        break;
    }

    const response = await api.get(
      `/inventory/movements/report?${queryParams}`,
      {
        responseType: "blob",
        headers: {
          Accept: responseType,
        },
      }
    );
    return response.data;
  },

  /**
   * Perform stock opname (stock taking)
   * @param {Object} opnameData - Stock opname data
   * @returns {Promise<Object>} Opname result
   */
  performStockOpname: async (opnameData) => {
    const response = await api.post("/inventory/opname", opnameData);
    return response.data;
  },

  /**
   * Get current stock report for a branch
   * @param {string} cabangId - Branch ID
   * @returns {Promise<Object>} Stock report data
   */
  getCurrentStockReport: async (cabangId) => {
    const response = await api.get(`/inventory/report/${cabangId}`);
    return response.data;
  },
  /**
   * Get inventory activities data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array>} Recent inventory activities
   */
  getInventoryActivities: async (cabangId, limit = 50) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);
    if (limit) params.append("limit", limit);

    const response = await api.get(
      `/inventory-dashboard/activities?${params}`
    );
    return response.data.data;
  },

  /**
   * Get inventory value by category
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {Promise<Array>} Inventory value data by category
   */
  getInventoryValueByCategory: async (cabangId) => {
    const params = new URLSearchParams();
    params.append("cabangId", cabangId);

    const response = await api.get(
      `/inventory-dashboard/value-by-category?${params}`
    );
    return response.data.data;
  },
};

export default inventoryService;
