import api from "./api";

/**
 * Service for managing hutang (debt) operations
 */
const hutangService = {
  /**
   * Get all hutang with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} List of hutang with pagination
   */
  getHutangList: async (filters = {}) => {
    const params = {
      cabangId: filters.cabangId,
      jenisHutang: filters.jenisHutang,
      statusHutang: filters.statusHutang,
      pelangganId: filters.pelangganId,
      supplierId: filters.supplierId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      jatuhTempoStart: filters.jatuhTempoStart,
      jatuhTempoEnd: filters.jatuhTempoEnd,
      search: filters.search,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
    const response = await api.get("/hutang", { params });
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
   * Create a payment for hutang (cicilan/pelunasan)
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  createPembayaran: async (data) => {
    const response = await api.post("/hutang", data);
    return response.data;
  },

  /**
   * Get payment history for a hutang
   * @param {string} hutangId - Hutang ID
   * @returns {Promise<Object>} List of payments
   */
  getPembayaranHistory: async (hutangId) => {
    const response = await api.get(`/hutang/${hutangId}/history`);
    return response.data;
  },

  /**
   * Get summary of hutang by entity (pelanggan/supplier)
   * @param {string} type - 'pelanggan' or 'supplier'
   * @param {string} id - Entity ID
   * @returns {Promise<Object>} Hutang summary
   */
  getHutangSummary: async (type, id) => {
    const response = await api.get(`/hutang/summary/${type}/${id}`);
    return response.data;
  },
};

export default hutangService;
