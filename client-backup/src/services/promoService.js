import api from "./api";

// Get all promos and discounts with optional filtering
const getAllPromos = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append("status", filters.status);
    if (filters.tipeDiskon)
      queryParams.append("tipeDiskon", filters.tipeDiskon);
    if (filters.cabangId) queryParams.append("cabangId", filters.cabangId);
    if (filters.kategoriId)
      queryParams.append("kategoriId", filters.kategoriId);
    if (filters.produkId) queryParams.append("produkId", filters.produkId);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.isActive !== undefined)
      queryParams.append("isActive", filters.isActive);
    if (filters.page) queryParams.append("page", filters.page);
    if (filters.limit) queryParams.append("limit", filters.limit);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await api.get(`/api/promos${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get details of a specific promo
const getPromoById = async (promoId) => {
  try {
    const response = await api.get(`/api/promos/${promoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new promo
const createPromo = async (promoData) => {
  try {
    const response = await api.post("/api/promos", promoData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an existing promo
const updatePromo = async (promoId, promoData) => {
  try {
    const response = await api.put(`/api/promos/${promoId}`, promoData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a promo
const deletePromo = async (promoId) => {
  try {
    const response = await api.delete(`/api/promos/${promoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Change promo status (activate/deactivate)
const changePromoStatus = async (promoId, status) => {
  try {
    const response = await api.patch(`/api/promos/${promoId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get promo usage statistics
const getPromoStats = async (promoId) => {
  try {
    const response = await api.get(`/api/promos/${promoId}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get list of products that are eligible for a specific promo
const getEligibleProducts = async (promoId) => {
  try {
    const response = await api.get(`/api/promos/${promoId}/eligible-products`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify if a promo code is valid
const verifyPromoCode = async (
  kodePromo,
  subtotal = 0,
  items = [],
  pelangganId = null
) => {
  try {
    const response = await api.post("/api/promos/verify", {
      kodePromo,
      subtotal,
      items,
      pelangganId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllPromos,
  getPromoById,
  createPromo,
  updatePromo,
  deletePromo,
  changePromoStatus,
  getPromoStats,
  getEligibleProducts,
  verifyPromoCode,
};
