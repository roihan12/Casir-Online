const express = require("express");
const discountConfigController = require("../controllers/discountConfigController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get all discount configs
router.get(
  "/",
  hasPermission(["promo:read"]),
  discountConfigController.getAllDiscountConfigs
);

// Get active config for a specific cabang
router.get(
  "/active/:cabangId",
  hasPermission(["promo:read", "transaksi:create"]),
  discountConfigController.getActiveConfigForCabang
);

// Get discount config by ID
router.get(
  "/:id",
  hasPermission(["promo:read"]),
  discountConfigController.getDiscountConfigById
);

// Create new discount config
router.post(
  "/",
  hasPermission(["promo:create"]),
  discountConfigController.createDiscountConfig
);

// Update discount config
router.put(
  "/:id",
  hasPermission(["promo:update"]),
  discountConfigController.updateDiscountConfig
);

// Delete discount config
router.delete(
  "/:id",
  hasPermission(["promo:delete"]),
  discountConfigController.deleteDiscountConfig
);

module.exports = router;
