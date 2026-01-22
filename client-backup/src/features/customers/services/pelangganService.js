import api from "../../../services/api";

const pelangganService = {
  // Get all customers
  getAllPelanggan: async (searchQuery = "", page = 1, limit = 10) => {
    const response = await api.get("/pelanggan", {
      params: { search: searchQuery, page, limit },
    });
    return response.data;
  },

  // Get customer by ID
  getPelangganById: async (id) => {
    const response = await api.get(`/pelanggan/${id}`);
    return response.data;
  },

  // Create new customer
  createPelanggan: async (pelangganData) => {
    const response = await api.post("/pelanggan", pelangganData);
    return response.data;
  },

  // Update customer
  updatePelanggan: async (id, pelangganData) => {
    const response = await api.put(`/pelanggan/${id}`, pelangganData);
    return response.data;
  },

  // Delete customer
  deletePelanggan: async (id) => {
    const response = await api.delete(`/pelanggan/${id}`);
    return response.data;
  },

  // Get loyalty point history
  getLoyaltyPointHistory: async (pelangganId) => {
    const response = await api.get(`/pelanggan/${pelangganId}/loyalty-points`);
    return response.data;
  },

  // Get customers by segment
  getPelangganBySegment: async (segment) => {
    const response = await api.get("/pelanggan", {
      params: { segment },
    });
    return response.data;
  },
};

export default pelangganService;
