import api from './index';

/**
 * Transactions API Service
 */
export const transaksiApi = {
  // Get transactions list with pagination
  getAll: async (params = {}) => {
    const response = await api.get('/transaksi', { params });
    return response.data;
  },

  // Get transaction by ID
  getById: async (id) => {
    const response = await api.get(`/transaksi/${id}`);
    return response.data;
  },

  // Create transaction (kasir)
  create: async (data) => {
    const response = await api.post('/transaksi', data);
    return response.data;
  },

  // Create credit transaction
  createCredit: async (data) => {
    const response = await api.post('/transaksi/kredit', data);
    return response.data;
  },

  // Process payment
  processPayment: async (id, data) => {
    const response = await api.post(`/transaksi/${id}/payment`, data);
    return response.data;
  },

  // Get sales report
  getSalesReport: async (params = {}) => {
    const response = await api.get('/transaksi/reports/sales', { params });
    return response.data;
  },

  // Get credit payment recommendation
  getCreditRecommendation: async (id) => {
    const response = await api.get(`/transaksi/${id}/kredit-recommendation`);
    return response.data;
  },

  // Cancel transaction
  cancel: async (id, reason) => {
    const response = await api.post(`/transaksi/${id}/cancel`, { reason });
    return response.data;
  },
};

export default transaksiApi;
