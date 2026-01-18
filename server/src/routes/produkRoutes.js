const express = require("express");
const router = express.Router();
const produkController = require("../controllers/produkController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// ========== STATIC ROUTES FIRST ==========

// GET - Product listing
router.get(
  "/",
  hasPermission(["produk:read"]),
  produkController.getAllProduk
);

// GET - Search products
router.get(
  "/search",
  hasPermission(["produk:read"]),
  produkController.getProdukByMasterAndCabang
);

// GET - Product templates
router.get(
  "/new/templates",
  hasPermission(["produk:read"]),
  produkController.getProductTemplates
);

// GET - Product by barcode
router.get(
  "/barcode/:barcode",
  hasPermission(["produk:read"]),
  produkController.getProductByBarcode
);

// GET - Frequently used products for a branch
router.get(
  "/frequent/:cabangId",
  hasPermission(["produk:read"]),
  produkController.getFrequentlyUsedProducts
);

// GET - Product recommendations
router.get(
  "/recommendations/:cabangId",
  hasPermission(["produk:read"]),
  produkController.getProductRecommendations
);

// GET - Low stock reports
router.get(
  "/reports/low-stock/:cabangId",
  hasPermission(["produk:read"]),
  produkController.getLowStockProducts
);

// POST - Bulk add products
router.post(
  "/bulk/:cabangId",
  hasPermission(["produk:create"]),
  produkController.bulkAddProducts
);

// POST - Create product
router.post(
  "/",
  hasPermission(["produk:create"]),
  produkController.createProduk
);

// ========== DYNAMIC ID ROUTES (MUST BE LAST) ==========

// GET - Product by ID
router.get(
  "/:id",
  hasPermission(["produk:read"]),
  produkController.getProdukById
);

// GET - Search products in branch
router.get(
  "/:cabangId/search",
  hasPermission(["produk:read"]),
  produkController.searchProducts
);

// PUT - Update product
router.put(
  "/:id",
  hasPermission(["produk:update"]),
  produkController.updateProduk
);

// PUT - Update stock
router.put(
  "/:id/stock",
  hasPermission(["produk:update", "inventory:update"]),
  produkController.updateStok
);

// GET - Inventory movements for product
router.get(
  "/:id/inventory-movements",
  hasPermission(["inventory:read"]),
  produkController.getInventoryMovements
);

// GET - Price history for product
router.get(
  "/:id/price-history",
  hasPermission(["produk:read"]),
  produkController.getPriceHistory
);

module.exports = router;
