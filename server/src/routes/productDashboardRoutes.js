const express = require("express");
const ProductDashboardController = require("../controllers/productDashboardController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware autentikasi untuk semua rute dashboard produk
router.use(authenticate);

/**
 * @route GET /api/product-dashboard
 * @desc Mendapatkan semua data dashboard produk
 * @access Private
 */
router.get("/", ProductDashboardController.getProductDashboardData);

/**
 * @route GET /api/product-dashboard/top-products
 * @desc Mendapatkan produk terlaris
 * @access Private
 */
router.get("/top-products", ProductDashboardController.getTopProducts);

/**
 * @route GET /api/product-dashboard/new-master-products
 * @desc Mendapatkan produk master baru yang ditambahkan oleh super admin
 * @access Private
 */
router.get(
  "/new-master-products",
  ProductDashboardController.getNewMasterProducts
);

/**
 * @route GET /api/product-dashboard/new-branch-products
 * @desc Mendapatkan produk baru yang ditambahkan di cabang
 * @access Private
 */
router.get(
  "/new-branch-products",
  ProductDashboardController.getNewBranchProducts
);

/**
 * @route GET /api/product-dashboard/inventory-value
 * @desc Mendapatkan nilai inventori
 * @access Private
 */
router.get("/inventory-value", ProductDashboardController.getInventoryValue);

/**
 * @route GET /api/product-dashboard/distribution
 * @desc Mendapatkan distribusi produk berdasarkan kategori
 * @access Private
 */
router.get("/distribution", ProductDashboardController.getProductDistribution);

/**
 * @route GET /api/product-dashboard/warnings
 * @desc Mendapatkan data warning untuk produk
 * @access Private
 */
router.get("/warnings", ProductDashboardController.getProductWarningData);

/**
 * @route POST /api/product-dashboard/invalidate-cache
 * @desc Invalidate cache dashboard produk
 * @access Private
 */
router.post(
  "/invalidate-cache",
  ProductDashboardController.invalidateProductDashboardCache
);

module.exports = router;
