import api from './index';

/**
 * Cabang API Service
 */
export const cabangApi = {
  getAll: async () => {
    const response = await api.get('/cabang');
    return response.data;
  },

  getById: async (cabangId) => {
    const response = await api.get(`/cabang/${cabangId}`);
    return response.data;
  },
};

export default cabangApi;
