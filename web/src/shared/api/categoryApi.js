import api from './index';

const categoryApi = {
  getAll: async (params) => {
    const response = await api.get('/kategori', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/kategori/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/kategori', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/kategori/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/kategori/${id}`);
    return response.data;
  },
};

export default categoryApi;
