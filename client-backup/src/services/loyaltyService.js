import api from "./api";

// ================================================================
// CONFIG API
// ================================================================

export const getLoyaltyConfig = async (cabangId = null) => {
  const params = cabangId ? { cabangId } : {};
  const response = await api.get("/loyalty/config", { params });
  return response.data;
};

export const createLoyaltyConfig = async (data) => {
  const response = await api.post("/loyalty/config", data);
  return response.data;
};

export const updateLoyaltyConfig = async (id, data) => {
  const response = await api.put(`/loyalty/config/${id}`, data);
  return response.data;
};

// ================================================================
// TIER API
// ================================================================

export const getAllTiers = async () => {
  const response = await api.get("/loyalty/tiers");
  return response.data;
};

export const getTierById = async (id) => {
  const response = await api.get(`/loyalty/tiers/${id}`);
  return response.data;
};

export const createTier = async (data) => {
  const response = await api.post("/loyalty/tiers", data);
  return response.data;
};

export const updateTier = async (id, data) => {
  const response = await api.put(`/loyalty/tiers/${id}`, data);
  return response.data;
};

export const deleteTier = async (id) => {
  const response = await api.delete(`/loyalty/tiers/${id}`);
  return response.data;
};

// ================================================================
// REWARD API
// ================================================================

export const getAllRewards = async (onlyActive = true) => {
  const response = await api.get("/loyalty/rewards", {
    params: { active: onlyActive }
  });
  return response.data;
};

export const getRewardById = async (id) => {
  const response = await api.get(`/loyalty/rewards/${id}`);
  return response.data;
};

export const createReward = async (data) => {
  const response = await api.post("/loyalty/rewards", data);
  return response.data;
};

export const updateReward = async (id, data) => {
  const response = await api.put(`/loyalty/rewards/${id}`, data);
  return response.data;
};

export const deleteReward = async (id) => {
  const response = await api.delete(`/loyalty/rewards/${id}`);
  return response.data;
};

// ================================================================
// CUSTOMER LOYALTY API
// ================================================================

export const getCustomerLoyaltyInfo = async (pelangganId) => {
  const response = await api.get(`/loyalty/customer/${pelangganId}`);
  return response.data;
};

export const getAvailableRewards = async (pelangganId) => {
  const response = await api.get(`/loyalty/customer/${pelangganId}/rewards`);
  return response.data;
};

export const getPointsHistory = async (pelangganId, limit = 50, offset = 0) => {
  const response = await api.get(`/loyalty/customer/${pelangganId}/history`, {
    params: { limit, offset }
  });
  return response.data;
};

export const redeemReward = async (pelangganId, rewardId, transaksiId = null) => {
  const response = await api.post("/loyalty/redeem", {
    pelangganId,
    rewardId,
    transaksiId
  });
  return response.data;
};

// ================================================================
// STATISTICS API
// ================================================================

export const getLoyaltyStats = async (cabangId = null) => {
  const params = cabangId ? { cabangId } : {};
  const response = await api.get("/loyalty/stats", { params });
  return response.data;
};

// ================================================================
// HOOKS EXPORTS (for React Query)
// ================================================================

export default {
  // Config
  getLoyaltyConfig,
  createLoyaltyConfig,
  updateLoyaltyConfig,
  // Tiers
  getAllTiers,
  getTierById,
  createTier,
  updateTier,
  deleteTier,
  // Rewards
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  // Customer
  getCustomerLoyaltyInfo,
  getAvailableRewards,
  getPointsHistory,
  redeemReward,
  // Stats
  getLoyaltyStats
};
