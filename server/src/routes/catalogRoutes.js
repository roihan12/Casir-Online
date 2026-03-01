const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");

// All catalog routes are PUBLIC — no auth required

// Get all active branches with catalogs globally for Store Finder
router.get("/active", catalogController.getActiveBranches);

// Get branch info (store name, address, operational hours)
router.get("/:cabangId/info", catalogController.getCabangInfo);

// Get product categories for a branch
router.get("/:cabangId/categories", catalogController.getCatalogCategories);

// Get catalog products with search & filter
router.get("/:cabangId/products", catalogController.getCatalogProducts);

// Get product detail
router.get("/:cabangId/product/:produkId", catalogController.getProductDetail);

// Verify promo code
router.post("/:cabangId/verify-promo", catalogController.verifyPromo);

// Get eligible promos for cart
router.post("/:cabangId/eligible-promos", catalogController.getEligiblePromos);

// Calculate delivery fee preview
router.post("/:cabangId/delivery-fee", catalogController.calculateDeliveryFeePreview);

// Get tax preview
router.post("/:cabangId/tax-preview", catalogController.getTaxPreview);

module.exports = router;
