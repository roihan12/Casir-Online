import api from "./api";

// Get customer loyalty information
const getCustomerLoyaltyInfo = async (pelangganId) => {
  try {
    const response = await api.get(`/api/loyalty/customer/${pelangganId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all loyalty tiers
const getLoyaltyTiers = async () => {
  try {
    const response = await api.get("/api/loyalty/tiers");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create or update loyalty tier
const saveLoyaltyTier = async (tierData) => {
  try {
    if (tierData.id) {
      const response = await api.put(
        `/api/loyalty/tiers/${tierData.id}`,
        tierData
      );
      return response.data;
    } else {
      const response = await api.post("/api/loyalty/tiers", tierData);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Delete loyalty tier
const deleteLoyaltyTier = async (tierId) => {
  try {
    const response = await api.delete(`/api/loyalty/tiers/${tierId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all rewards
const getLoyaltyRewards = async () => {
  try {
    const response = await api.get("/api/loyalty/rewards");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create or update reward
const saveLoyaltyReward = async (rewardData) => {
  try {
    if (rewardData.id) {
      const response = await api.put(
        `/api/loyalty/rewards/${rewardData.id}`,
        rewardData
      );
      return response.data;
    } else {
      const response = await api.post("/api/loyalty/rewards", rewardData);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Delete reward
const deleteLoyaltyReward = async (rewardId) => {
  try {
    const response = await api.delete(`/api/loyalty/rewards/${rewardId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Redeem points for a reward
const redeemPoints = async (pelangganId, rewardId) => {
  try {
    const response = await api.post(`/api/loyalty/redeem`, {
      pelangganId,
      rewardId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get customer segment rules
const getSegmentRules = async () => {
  try {
    const response = await api.get("/api/loyalty/segments");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Save segment rules
const saveSegmentRule = async (segmentData) => {
  try {
    if (segmentData.id) {
      const response = await api.put(
        `/api/loyalty/segments/${segmentData.id}`,
        segmentData
      );
      return response.data;
    } else {
      const response = await api.post("/api/loyalty/segments", segmentData);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Delete segment rule
const deleteSegmentRule = async (segmentId) => {
  try {
    const response = await api.delete(`/api/loyalty/segments/${segmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Run customer segmentation
const runSegmentation = async () => {
  try {
    const response = await api.post("/api/loyalty/segments/run");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get loyalty statistics
const getLoyaltyStats = async () => {
  try {
    const response = await api.get("/api/loyalty/stats");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get points history for a customer
const getPointsHistory = async (pelangganId, page = 1, limit = 10) => {
  try {
    const response = await api.get(
      `/api/loyalty/customer/${pelangganId}/history?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getCustomerLoyaltyInfo,
  getLoyaltyTiers,
  saveLoyaltyTier,
  deleteLoyaltyTier,
  getLoyaltyRewards,
  saveLoyaltyReward,
  deleteLoyaltyReward,
  redeemPoints,
  getSegmentRules,
  saveSegmentRule,
  deleteSegmentRule,
  runSegmentation,
  getLoyaltyStats,
  getPointsHistory,
};
