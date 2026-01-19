import api from './index';

/**
 * User API Service
 */
export const userApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  changeStatus: async (id, status) => {
    const response = await api.put(`/users/${id}/status`, { status });
    return response.data;
  },

  resetPassword: async (id, password) => {
    const response = await api.post(`/users/${id}/reset-password`, { password });
    return response.data;
  },

  forceLogout: async (id) => {
    const response = await api.post(`/users/${id}/force-logout`);
    return response.data;
  },
};

export default userApi;
