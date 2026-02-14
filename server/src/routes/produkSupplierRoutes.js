const express = require("express");
const router = express.Router();
const produkSupplierController = require("../controllers/produkSupplierController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// Create a new product-supplier relationship
router.post(
  "/",
  hasPermission(["supplier:manage"]),
  produkSupplierController.createProdukSupplier
);

// Update an existing product-supplier relationship
router.put(
  "/:id",
  hasPermission(["supplier:manage"]),
  produkSupplierController.updateProdukSupplier
);

// Delete a product-supplier relationship
router.delete(
  "/:id",
  hasPermission(["supplier:manage"]),
  produkSupplierController.deleteProdukSupplier
);

// Get all suppliers for a product
router.get(
  "/product/:produkMasterId/suppliers",
  hasPermission(["supplier:read"]),
  produkSupplierController.getSuppliersByProduct
);

// Get all products for a supplier
router.get(
  "/supplier/:supplierId/products",
  hasPermission(["supplier:read"]),
  produkSupplierController.getProductsBySupplier
);

router.get(
  "/supplier/:supplierId/products/available",
  hasPermission(["supplier:read"]),
  produkSupplierController.getAvailableProductsForSupplier
);

// Get all branches with access to a supplier's products
router.get(
  "/supplier/:supplierId/branches",
  hasPermission(["supplier:read"]),
  produkSupplierController.getBranchesWithSupplierAccess
);

// Get price history for all products from a supplier
router.get(
  "/supplier/:supplierId/price-history",
  hasPermission(["supplier:read"]),
  produkSupplierController.getSupplierPriceHistory
);

module.exports = router;
