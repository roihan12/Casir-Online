const discountConfigService = require("../services/discountConfigService");

/**
 * Get all discount configs
 */
const getAllDiscountConfigs = async (req, res, next) => {
  try {
    const { cabangId } = req.query;
    const result = await discountConfigService.getAllDiscountConfigs(cabangId);

    return res.status(200).json({
      success: true,
      message: "Discount configs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get discount config by ID
 */
const getDiscountConfigById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await discountConfigService.getDiscountConfigById(id);

    return res.status(200).json({
      success: true,
      message: "Discount config retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new discount config
 */
const createDiscountConfig = async (req, res, next) => {
  try {
    const result = await discountConfigService.createDiscountConfig(req.body);

    return res.status(201).json({
      success: true,
      message: "Discount config created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update discount config
 */
const updateDiscountConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await discountConfigService.updateDiscountConfig(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Discount config updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete discount config
 */
const deleteDiscountConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await discountConfigService.deleteDiscountConfig(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active config for a cabang
 */
const getActiveConfigForCabang = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const result = await discountConfigService.getActiveConfigForCabang(cabangId);

    return res.status(200).json({
      success: true,
      message: result ? "Active config found" : "No active config found",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDiscountConfigs,
  getDiscountConfigById,
  createDiscountConfig,
  updateDiscountConfig,
  deleteDiscountConfig,
  getActiveConfigForCabang,
};
