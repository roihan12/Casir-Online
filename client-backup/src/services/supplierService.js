import api from "./api";

const SUPPLIER_URL = "/supplier";

// Simple supplier service with all necessary methods
const supplierService = {
  /**
   * Get all suppliers with optional pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Paginated supplier list
   */
  getAllSuppliers: async (params = {}) => {
    const response = await api.get(SUPPLIER_URL, { params });
    return response.data;
  },

  /**
   * Get a supplier by ID
   * @param {string} id - The supplier ID
   * @returns {Promise<Object>} - Supplier data
   */
  getSupplierById: async (id) => {
    const response = await api.get(`${SUPPLIER_URL}/${id}/detail`);
    return response.data;
  },

  /**
   * Get detailed information about a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<Object>} - Detailed supplier data
   */
  getSupplierDetail: async (id) => {
    const response = await api.get(`${SUPPLIER_URL}/${id}/detail`);
    return response.data;
  },

  /**
   * Create a new supplier
   * @param {Object} supplierData - The supplier data
   * @returns {Promise<Object>} - Created supplier
   */
  createSupplier: async (supplierData) => {
    const response = await api.post(SUPPLIER_URL, supplierData);
    return response.data;
  },

  /**
   * Update a supplier
   * @param {string} id - The supplier ID
   * @param {Object} supplierData - The updated supplier data
   * @returns {Promise<Object>} - Updated supplier
   */
  updateSupplier: async (id, supplierData) => {
    const response = await api.put(`${SUPPLIER_URL}/${id}`, supplierData);
    return response.data;
  },

  /**
   * Delete a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<Object>} - Success message
   */
  deleteSupplier: async (id) => {
    const response = await api.delete(`${SUPPLIER_URL}/${id}`);
    return response.data;
  },

  // Get products from a supplier - now uses the produk-supplier API
  getSupplierProducts: async (supplierId, params = {}) => {
    const response = await api.get(
      `/produk-supplier/supplier/${supplierId}/products`,
      {
        params,
      }
    );
    return response.data.data;
  },

  // Get purchase history of a supplier
  getSupplierPurchaseHistory: async (supplierId, filters = {}) => {
    const response = await api.get(`/transaksi`, {
      params: {
        ...filters,
        supplier_id: supplierId,
        jenis_transaksi: "PEMBELIAN",
      },
    });
    return response.data;
  },

  // Get branches that can purchase from a supplier
  getSupplierBranches: async (supplierId) => {
    const response = await api.get(
      `/produk-supplier/supplier/${supplierId}/branches`
    );
    return response.data;
  },

  /**
   * Change supplier status (activate/deactivate)
   * @param {string} id - The supplier ID
   * @param {string} status - The new status ('aktif' or 'nonaktif')
   * @returns {Promise<Object>} - Updated supplier
   */
  changeSupplierStatus: async (id, status) => {
    const response = await api.patch(`${SUPPLIER_URL}/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Get supplier dashboard statistics with optional cabangId filter
  getSupplierDashboardStats: async (cabangId = "") => {
    const response = await api.get("/supplier/dashboard", {
      params: cabangId ? { cabangId } : {},
    });
    return response.data;
  },
};

export default supplierService;
