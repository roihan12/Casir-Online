import api from "@common/utils/api";

const productRequestService = {
  getRequestList: async (params) => {
    const { data } = await api.get("/produk-request", { params });
    // In many of these services, data is nested under data.data
    return data;
  },

  getProdukRequestById: async (id) => {
    const { data } = await api.get(`/produk-request/${id}`);
    return data.data || data;
  },

  createRequest: async (requestData) => {
    const { data } = await api.post("/produk-request", requestData);
    return data.data || data;
  },

  updateRequest: async (id, requestData) => {
    const { data } = await api.put(`/produk-request/${id}`, requestData);
    return data.data || data;
  },

  deleteRequest: async (id) => {
    const { data } = await api.delete(`/produk-request/${id}`);
    return data;
  },

  submitRequest: async (id) => {
    const { data } = await api.post(`/produk-request/${id}/submit`);
    return data.data || data;
  },

  processRequest: async (id, { isApproved, catatan }) => {
    const { data } = await api.post(`/produk-request/${id}/process`, {
      isApproved,
      catatan,
    });
    return data.data || data;
  },

  completeRequest: async (id) => {
    const { data } = await api.post(`/produk-request/${id}/complete`);
    return data.data || data;
  },

  getAnalytics: async (params) => {
    const { data } = await api.get("/produk-request/analytics", { params });
    return data.data || data;
  },

  getBranchList: async () => {
    const { data } = await api.get("/cabang");
    return data.data || data;
  },

  getUserList: async () => {
    const { data } = await api.get("/users");
    return data.data || data;
  },
};

export default productRequestService;
