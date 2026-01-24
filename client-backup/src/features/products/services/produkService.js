import api from "@common/utils/api";

const produkService = {
  getAllProduk: async (params) => {
    const { data } = await api.get("/produk", { params });
    return data;
  },

  getProdukById: async (id) => {
    const { data } = await api.get(`/produk/${id}`);
    return data;
  },

  getProductTemplates: async (cabangId) => {
    const { data } = await api.get(`/produk/new/templates?cabangId=${cabangId}`);
    return data;
  },

  getProductRecommendations: async (cabangId, params) => {
    const { data } = await api.get(`/produk/recommendations/${cabangId}`, { params });
    return data;
  },

  bulkAddProducts: async (cabangId, productsData) => {
    const { data } = await api.post(`/produk/bulk/${cabangId}`, productsData);
    return data;
  },

  createProduk: async (produkData) => {
    const { data } = await api.post("/produk", produkData);
    return data;
  },

  updateProduk: async (id, produkData) => {
    const { data } = await api.put(`/produk/${id}`, produkData);
    return data;
  },

  updateStok: async (id, stokData) => {
    const { data } = await api.patch(`/produk/${id}/stock`, stokData);
    return data;
  },

  getInventoryMovements: async (id, params) => {
    const { data } = await api.get(`/produk/${id}/inventory-movements`, { params });
    return data;
  },

  getPriceHistory: async (id, params) => {
    const { data } = await api.get(`/produk/${id}/price-history`, { params });
    return data;
  }
};

export default produkService;
