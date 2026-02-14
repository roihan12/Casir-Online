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

  // Added methods to match usage in useHutang.js
  
  getSupplierHutang: async (supplierId, params = {}) => {
    return hutangService.getHutangList({ ...params, supplierId });
  },

  getSupplierHutangSummary: async (supplierId, params = {}) => {
    // Note: Backend currently ignores params for summary
    return hutangService.getHutangSummary('supplier', supplierId);
  },

  getPayments: async (hutangId) => {
    return hutangService.getPembayaranHistory(hutangId);
  },

  createPayment: async (data) => {
    return hutangService.createPembayaran(data);
  },

  // Placeholders/Aliases for methods likely intended but maybe not implemented in backend yet
  // or handled by different services (e.g. Transaction)
  createHutang: async (data) => {
    // Check if this should be a transaction creation
    // For now assuming it maps to payment or throws error if not implemented
    console.warn("createHutang not explicitly implemented in service");
    return hutangService.createPembayaran(data); 
  },

  updateHutang: async (id, data) => {
      // Placeholder
      console.warn("updateHutang not implemented");
      return {};
  },

  deleteHutang: async (id) => {
      // Placeholder
      console.warn("deleteHutang not implemented");
      return {};
  }
};

export default hutangService;
