const promoService = require("../services/promoService");

/**
 * Create a new promo
 */
const createPromo = async (req, res, next) => {
  try {
    const promoData = req.body;
    const context = {
      userId: req.user?.id || req.user?.userId,
      ipAddress: req.ip,
      userName: req.user?.namaLengkap || req.user?.name,
    };

    const result = await promoService.createPromo(promoData, context);

    return res.status(201).json({
      success: true,
      message: "Promo created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing promo
 */
const updatePromo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const context = {
      userId: req.user?.id || req.user?.userId,
      ipAddress: req.ip,
      userName: req.user?.namaLengkap || req.user?.name,
    };

    const result = await promoService.updatePromo(id, updateData, context);

    return res.status(200).json({
      success: true,
      message: "Promo updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a promo (soft delete)
 */
const deletePromo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = {
      userId: req.user?.id || req.user?.userId,
      ipAddress: req.ip,
      userName: req.user?.namaLengkap || req.user?.name,
    };

    const result = await promoService.deletePromo(id, context);

    return res.status(200).json({
      success: true,
      message: "Promo deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all promos with filters and pagination
 */
const getAllPromos = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = null,
      tipeDiskon = null,
      cabangId = null,
      kategoriId = null,
      produkId = null,
    } = req.query;

    const result = await promoService.getAllPromos({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      tipeDiskon,
      cabangId,
      kategoriId,
      produkId,
    });

    return res.status(200).json({
      success: true,
      message: "Promos retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a promo by ID
 */
const getPromoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promo = await promoService.getPromoById(id);

    return res.status(200).json({
      success: true,
      message: "Promo retrieved successfully",
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change promo status
 */
const changePromoStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const context = {
      userId: req.user?.id || req.user?.userId,
      ipAddress: req.ip,
      userName: req.user?.namaLengkap || req.user?.name,
    };

    const result = await promoService.changePromoStatus(id, status, context);

    return res.status(200).json({
      success: true,
      message: "Promo status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promo usage statistics
 */
const getPromoStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await promoService.getPromoStats(id);

    return res.status(200).json({
      success: true,
      message: "Promo statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get eligible products for a specific promo
 */
const getEligibleProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await promoService.getEligibleProducts(id);

    return res.status(200).json({
      success: true,
      message: "Eligible products retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a single promo code
 */
const verifyPromoCode = async (req, res, next) => {
  try {
    const { kodePromo, subtotal, cabangId, items, pelangganId, metodePembayaran } = req.body;

    const result = await promoService.verifyPromoCode({
      kodePromo,
      subtotal,
      cabangId,
      items,
      pelangganId,
      metodePembayaran,
    });

    return res.status(200).json({
      success: true,
      message: "Promo code verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify multiple promo codes
 */
const verifyMultiplePromos = async (req, res, next) => {
  try {
    const { promoCodes, cabangId, subtotal, items, pelangganId, metodePembayaran } = req.body;

    const result = await promoService.verifyMultiplePromos({
      promoCodes,
      cabangId,
      subtotal,
      items,
      pelangganId,
      metodePembayaran,
    });

    return res.status(200).json({
      success: true,
      message: "Promo codes verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate preview for promo application
 */
const calculatePreview = async (req, res, next) => {
  try {
    const { promoCodes, cabangId, pelangganId, subtotal, items, metodePembayaran } = req.body;

    const result = await promoService.calculatePreview({
      promoCodes,
      cabangId,
      pelangganId,
      subtotal,
      items,
      metodePembayaran,
    });

    return res.status(200).json({
      success: true,
      message: "Preview calculated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get eligible promos for a branch
 */
const getEligiblePromos = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { subtotal, items } = req.query;

    const cartData = {
      subtotal: subtotal ? parseFloat(subtotal) : 0,
      items: items ? JSON.parse(items) : [],
    };

    const result = await promoService.getEligiblePromos(cabangId, cartData);

    return res.status(200).json({
      success: true,
      message: "Eligible promos retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromo,
  updatePromo,
  deletePromo,
  getAllPromos,
  getPromoById,
  changePromoStatus,
  getPromoStats,
  getEligibleProducts,
  verifyPromoCode,
  verifyMultiplePromos,
  calculatePreview,
  getEligiblePromos,
};
