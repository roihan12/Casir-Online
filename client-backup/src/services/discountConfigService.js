import api from "./api";

/**
 * Get all discount configs
 */
const getAllDiscountConfigs = async (cabangId = null) => {
  try {
    const params = cabangId ? { cabangId } : {};
    const response = await api.get("/discount-config", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get discount config by ID
 */
const getDiscountConfigById = async (id) => {
  try {
    const response = await api.get(`/discount-config/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new discount config
 */
const createDiscountConfig = async (data) => {
  try {
    const response = await api.post("/discount-config", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update discount config
 */
const updateDiscountConfig = async (id, data) => {
  try {
    const response = await api.put(`/discount-config/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete discount config
 */
const deleteDiscountConfig = async (id) => {
  try {
    const response = await api.delete(`/discount-config/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get active config for a cabang
 */
const getActiveConfigForCabang = async (cabangId) => {
  try {
    const response = await api.get(`/discount-config/active/${cabangId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllDiscountConfigs,
  getDiscountConfigById,
  createDiscountConfig,
  updateDiscountConfig,
  deleteDiscountConfig,
  getActiveConfigForCabang,
};
