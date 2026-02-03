const loyaltyService = require("../services/loyaltyService");

// ================================================================
// CONFIG CONTROLLERS
// ================================================================

const getConfig = async (req, res, next) => {
  try {
    const cabangId = req.query.cabangId || req.user?.cabangId || null;
    const config = await loyaltyService.getLoyaltyConfig(cabangId);
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const config = await loyaltyService.updateLoyaltyConfig(id, req.body, userId);
    
    res.status(200).json({
      success: true,
      message: "Konfigurasi loyalty berhasil diperbarui",
      data: config
    });
  } catch (error) {
    next(error);
  }
};

const createConfig = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const config = await loyaltyService.createLoyaltyConfig(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: "Konfigurasi loyalty berhasil dibuat",
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================
// TIER CONTROLLERS
// ================================================================

const getAllTiers = async (req, res, next) => {
  try {
    const tiers = await loyaltyService.getAllTiers();
    
    res.status(200).json({
      success: true,
      data: tiers
    });
  } catch (error) {
    next(error);
  }
};

const getTierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tier = await loyaltyService.getTierById(id);
    
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: "Tier tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      data: tier
    });
  } catch (error) {
    next(error);
  }
};

const createTier = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const tier = await loyaltyService.createTier(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: "Tier berhasil dibuat",
      data: tier
    });
  } catch (error) {
    next(error);
  }
};

const updateTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const tier = await loyaltyService.updateTier(id, req.body, userId);
    
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: "Tier tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Tier berhasil diperbarui",
      data: tier
    });
  } catch (error) {
    next(error);
  }
};

const deleteTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tier = await loyaltyService.deleteTier(id);
    
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: "Tier tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Tier berhasil dihapus"
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================
// REWARD CONTROLLERS
// ================================================================

const getAllRewards = async (req, res, next) => {
  try {
    const onlyActive = req.query.active !== 'false';
    const rewards = await loyaltyService.getAllRewards(onlyActive);
    
    res.status(200).json({
      success: true,
      data: rewards
    });
  } catch (error) {
    next(error);
  }
};

const getRewardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await loyaltyService.getRewardById(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

const createReward = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const reward = await loyaltyService.createReward(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: "Reward berhasil dibuat",
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

const updateReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const reward = await loyaltyService.updateReward(id, req.body, userId);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Reward berhasil diperbarui",
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await loyaltyService.deleteReward(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Reward berhasil dihapus"
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================
// CUSTOMER LOYALTY CONTROLLERS
// ================================================================

const getCustomerLoyaltyInfo = async (req, res, next) => {
  try {
    const { pelangganId } = req.params;
    const info = await loyaltyService.getCustomerLoyaltyInfo(pelangganId);
    
    if (!info || !info.success) {
      return res.status(404).json({
        success: false,
        message: info?.error || "Pelanggan tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableRewards = async (req, res, next) => {
  try {
    const { pelangganId } = req.params;
    const rewards = await loyaltyService.getAvailableRewards(pelangganId);
    
    if (!rewards || !rewards.success) {
      return res.status(404).json({
        success: false,
        message: rewards?.error || "Pelanggan tidak ditemukan"
      });
    }
    
    res.status(200).json({
      success: true,
      data: rewards
    });
  } catch (error) {
    next(error);
  }
};

const redeemReward = async (req, res, next) => {
  try {
    const { pelangganId, rewardId, transaksiId } = req.body;
    const userId = req.user?.id;
    
    if (!pelangganId || !rewardId) {
      return res.status(400).json({
        success: false,
        message: "pelangganId dan rewardId harus diisi"
      });
    }
    
    const result = await loyaltyService.redeemReward(
      pelangganId,
      rewardId,
      transaksiId || null,
      userId
    );
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: result?.error || "Gagal redeem reward"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Reward berhasil ditukar",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getPointsHistory = async (req, res, next) => {
  try {
    const { pelangganId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await loyaltyService.getPointsHistory(pelangganId, limit, offset);
    
    res.status(200).json({
      success: true,
      data: history.data,
      pagination: {
        total: history.total,
        limit: history.limit,
        offset: history.offset
      }
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================
// STATISTICS CONTROLLER
// ================================================================

const getLoyaltyStats = async (req, res, next) => {
  try {
    const cabangId = req.query.cabangId || req.user?.cabangId || null;
    const stats = await loyaltyService.getLoyaltyStats(cabangId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Config
  getConfig,
  updateConfig,
  createConfig,
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
  redeemReward,
  getPointsHistory,
  // Stats
  getLoyaltyStats
};
