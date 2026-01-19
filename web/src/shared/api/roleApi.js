import api from './index';

/**
 * Role API Service
 */
export const roleApi = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },

  clone: async (id, newRoleName) => {
    const response = await api.post(`/roles/${id}/clone`, { newRoleName });
    return response.data;
  },
};

export default roleApi;

