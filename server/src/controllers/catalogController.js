const catalogService = require("../services/catalogService");
const promoService = require("../services/promoService");
const { validate } = require("../validation/validation");
const {
  getCatalogProductsValidation,
  getCatalogCategoriesValidation,
  getProductDetailValidation,
  getCabangInfoValidation,
  verifyPromoValidation,
  getEligiblePromosValidation,
} = require("../validation/catalogValidation");

/**
 * Get catalog products for a branch
 * GET /api/catalog/:cabangId/products
 */
const getCatalogProducts = async (req, res, next) => {
  try {
    const filters = validate(getCatalogProductsValidation, {
      cabangId: req.params.cabangId,
      search: req.query.search,
      kategoriId: req.query.kategoriId,
      sortBy: req.query.sortBy,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      minPrice: req.query.minPrice
        ? parseFloat(req.query.minPrice)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseFloat(req.query.maxPrice)
        : undefined,
    });

    const result = await catalogService.getCatalogProducts(
      filters.cabangId,
      filters
    );

    res.status(200).json({
      status: true,
      message: "Success get catalog products",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories for a branch catalog
 * GET /api/catalog/:cabangId/categories
 */
const getCatalogCategories = async (req, res, next) => {
  try {
    const { cabangId } = validate(getCatalogCategoriesValidation, {
      cabangId: req.params.cabangId,
    });

    const result = await catalogService.getCatalogCategories(cabangId);

    res.status(200).json({
      status: true,
      message: "Success get catalog categories",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get branch info for catalog
 * GET /api/catalog/:cabangId/info
 */
const getCabangInfo = async (req, res, next) => {
  try {
    const { cabangId } = validate(getCabangInfoValidation, {
      cabangId: req.params.cabangId,
    });

    const result = await catalogService.getCabangInfo(cabangId);

    res.status(200).json({
      status: true,
      message: "Success get store info",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product detail
 * GET /api/catalog/product/:produkId
 */
const getProductDetail = async (req, res, next) => {
  try {
    const { produkId } = validate(getProductDetailValidation, {
      produkId: req.params.produkId,
    });
    const cabangId = req.params.cabangId;

    const result = await catalogService.getProductDetail(produkId, cabangId);

    res.status(200).json({
      status: true,
      message: "Success get product detail",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a promo code for catalog checkout
 * POST /api/catalog/:cabangId/verify-promo
 */
const verifyPromo = async (req, res, next) => {
  try {
    const data = validate(verifyPromoValidation, {
      cabangId: req.params.cabangId,
      ...req.body,
    });

    const result = await promoService.verifyPromoCode({
      kode_promo: data.kode_promo,
      cabang_id: data.cabangId,
      total_belanja: data.total_belanja,
      pelanggan_id: data.pelanggan_id || null,
      items: data.items || [],
    });

    res.status(200).json({
      status: true,
      message: "Promo code valid",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get eligible promos for catalog cart
 * POST /api/catalog/:cabangId/eligible-promos
 */
const getEligiblePromos = async (req, res, next) => {
  try {
    const data = validate(getEligiblePromosValidation, {
      cabangId: req.params.cabangId,
      ...req.body,
    });

    const result = await promoService.getEligiblePromos(data.cabangId, {
      total_belanja: data.total_belanja,
      pelanggan_id: data.pelanggan_id || null,
      items: data.items || [],
    });

    res.status(200).json({
      status: true,
      message: "Success get eligible promos",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCatalogProducts,
  getCatalogCategories,
  getCabangInfo,
  getProductDetail,
  verifyPromo,
  getEligiblePromos,
};
