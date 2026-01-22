import api from "./api";

/**
 * Service for managing hutang (debt) operations
 */
const hutangService = {
  /**
   * Get all hutang with filters
   * @param {Object} filters - Filter parameters (cabangId, supplierId, pelangganId, status, etc.)
   * @returns {Promise<Object>} List of hutang with pagination
   */
  getHutangList: async (filters = {}) => {
    const response = await api.get("/hutang", { params: filters });
    return response.data;
  },

  /**
   * Get hutang by ID
   * @param {string} id - Hutang ID
   * @returns {Promise<Object>} Hutang details
   */
  getHutangById: async (id) => {
    const response = await api.get(`/hutang/${id}`);
    return response.data;
  },

  /**
   * Create a new hutang
   * @param {Object} data - Hutang data
   * @returns {Promise<Object>} Created hutang
   */
  createHutang: async (data) => {
    const response = await api.post("/hutang", data);
    return response.data;
  },

  /**
   * Update hutang
   * @param {string} id - Hutang ID
   * @param {Object} data - Hutang data to update
   * @returns {Promise<Object>} Updated hutang
   */
  updateHutang: async (id, data) => {
    const response = await api.put(`/hutang/${id}`, data);
    return response.data;
  },

  /**
   * Delete hutang
   * @param {string} id - Hutang ID
   * @returns {Promise<Object>} Response
   */
  deleteHutang: async (id) => {
    const response = await api.delete(`/hutang/${id}`);
    return response.data;
  },

  /**
   * Create a payment for hutang
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  createPayment: async (data) => {
    const response = await api.post("/hutang/payment", data);
    return response.data;
  },

  /**
   * Get payments for a hutang
   * @param {string} hutangId - Hutang ID
   * @returns {Promise<Object>} List of payments
   */
  getPayments: async (hutangId) => {
    const response = await api.get(`/hutang/${hutangId}/payments`);
    return response.data;
  },

  /**
   * Get summary of hutang by supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Hutang summary
   */
  getSupplierHutangSummary: async (supplierId, filters = {}) => {
    const response = await api.get(`/hutang/supplier/${supplierId}/summary`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get all hutang for a supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} List of supplier's hutang with pagination
   */
  getSupplierHutang: async (supplierId, filters = {}) => {
    const response = await api.get(`/hutang/supplier/${supplierId}`, {
      params: filters,
    });
    return response.data;
  },
};

export default hutangService;
