import api from './index';

/**
 * Products API Service
 */
export const produkApi = {
  // Get all products with pagination
  getAll: async (params = {}) => {
    const response = await api.get('/produk', { params });
    return response.data;
  },

  // Search products
  search: async (cabangId, query) => {
    const response = await api.get(`/produk/${cabangId}/search`, { params: { q: query } });
    return response.data;
  },

  // Get product by ID
  getById: async (id) => {
    const response = await api.get(`/produk/${id}`);
    return response.data;
  },

  // Get product by barcode
  getByBarcode: async (barcode) => {
    const response = await api.get(`/produk/barcode/${barcode}`);
    return response.data;
  },

  // Create product
  create: async (data) => {
    const response = await api.post('/produk', data);
    return response.data;
  },

  // Update product
  update: async (id, data) => {
    const response = await api.put(`/produk/${id}`, data);
    return response.data;
  },

  // Update stock
  updateStock: async (id, data) => {
    const response = await api.put(`/produk/${id}/stock`, data);
    return response.data;
  },

  // Get low stock products
  getLowStock: async (cabangId) => {
    const response = await api.get(`/produk/reports/low-stock/${cabangId}`);
    return response.data;
  },

  // Get frequently used products
  getFrequent: async (cabangId) => {
    const response = await api.get(`/produk/frequent/${cabangId}`);
    return response.data;
  },

  // Get price history
  getPriceHistory: async (id) => {
    const response = await api.get(`/produk/${id}/price-history`);
    return response.data;
  },
};

export default produkApi;
