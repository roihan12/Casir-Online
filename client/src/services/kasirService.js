import api from "./api";

const kasirService = {
  /**
   * Get dashboard data for kasir
   * @param {String} cabangId - Optional branch ID (defaults to primary branch)
   * @returns {Promise} Dashboard data
   */
  getKasirDashboard: async (cabangId = null) => {
    try {
      const response = await api.get("/kasir/dashboard", {
        params: cabangId ? { cabangId } : {},
      });
      return response.data.data
    } catch (error) {
      console.error("Error fetching kasir dashboard:", error);
      throw error;
    }
  },

  /**
   * Get active shift information
   * @param {String} cabangId - Branch ID
   * @returns {Promise} Active shift data
   */
  getActiveShift: async (cabangId) => {
    try {
      const response = await api.get(`/kasir/shift/active`, {
        params: { cabangId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching active shift:", error);
      throw error;
    }
  },

  /**
   * Open a new shift
   * @param {Object} shiftData - Shift data
   * @returns {Promise} Created shift
   */
  openShift: async (shiftData) => {
    try {
      const response = await api.post("/kasir/shift/open", shiftData);
      return response.data;
    } catch (error) {
      console.error("Error opening shift:", error);
      throw error;
    }
  },

  /**
   * Close current shift
   * @param {Object} closeData - Close shift data
   * @returns {Promise} Closed shift data
   */
  closeShift: async (closeData) => {
    try {
      const response = await api.post("/kasir/shift/close", closeData);
      return response.data;
    } catch (error) {
      console.error("Error closing shift:", error);
      throw error;
    }
  },

  /**
   * Get shifts history
   * @param {String} cabangId - Branch ID
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise} Paginated shifts history
   */
  getShiftsHistory: async (cabangId, page = 1, limit = 10) => {
    try {
      const response = await api.get("/kasir/shifts", {
        params: {
          cabangId,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching shifts history:", error);
      throw error;
    }
  },

  /**
   * Search products
   * @param {String} query - Search query
   * @param {String} cabangId - Branch ID
   * @returns {Promise} Products matching search
   */
  searchProducts: async (query, cabangId) => {
    try {
      const response = await api.get("/kasir/products/search", {
        params: {
          query,
          cabangId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  /**
   * Get product by barcode or SKU
   * @param {String} code - Barcode or SKU
   * @param {String} cabangId - Branch ID
   * @returns {Promise} Product details
   */
  getProductByCode: async (code, cabangId) => {
    try {
      const response = await api.get(`/kasir/products/code/${code}`, {
        params: { cabangId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching product by code:", error);
      throw error;
    }
  },

  /**
   * Search customers
   * @param {String} query - Search query
   * @param {String} cabangId - Branch ID
   * @returns {Promise} Customers matching search
   */
  searchCustomers: async (query, cabangId) => {
    try {
      const response = await api.get("/kasir/customers/search", {
        params: {
          query,
          cabangId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching customers:", error);
      throw error;
    }
  },

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise} Created transaction
   */
  createTransaction: async (transactionData) => {
    try {
      const response = await api.post(
        "/kasir/transactions",
        transactionData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  /**
   * Get transaction details
   * @param {String} transactionId - Transaction ID
   * @returns {Promise} Transaction details
   */
  getTransactionDetails: async (transactionId) => {
    try {
      const response = await api.get(
        `/kasir/transactions/${transactionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      throw error;
    }
  },

  /**
   * Get recent transactions
   * @param {String} cabangId - Branch ID
   * @param {Number} limit - Results limit
   * @returns {Promise} Recent transactions
   */
  getRecentTransactions: async (cabangId, limit = 10) => {
    try {
      const response = await api.get("/kasir/transactions/recent", {
        params: {
          cabangId,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      throw error;
    }
  },

  /**
   * Print receipt
   * @param {String} transactionId - Transaction ID
   * @returns {Promise} Receipt data or print status
   */
  printReceipt: async (transactionId) => {
    try {
      const response = await api.post(
        `/kasir/receipts/print/${transactionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error printing receipt:", error);
      throw error;
    }
  },

  /**
   * Get receipt configuration
   * @param {String} cabangId - Branch ID
   * @returns {Promise} Receipt configuration
   */
  getReceiptConfig: async (cabangId) => {
    try {
      const response = await api.get("/kasir/receipts/config", {
        params: { cabangId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching receipt config:", error);
      throw error;
    }
  },

  /**
   * Get daily summary
   * @param {String} cabangId - Branch ID
   * @param {String} date - Date in ISO format (defaults to today)
   * @returns {Promise} Daily summary
   */
  getDailySummary: async (
    cabangId,
    date = new Date().toISOString().split("T")[0]
  ) => {
    try {
      const response = await api.get("/kasir/reports/daily", {
        params: {
          cabangId,
          date,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      throw error;
    }
  },
};

export default kasirService;
