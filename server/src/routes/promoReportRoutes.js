const express = require("express");
const router = express.Router();
const promoReportController = require("../controllers/promoReportController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

/**
 * Promo & Discount Report Routes
 * All routes require authentication and report:read permission
 */

// Get promo summary
router.get(
  "/summary",
  authenticate,
  hasPermission(["laporan:read"]),
  promoReportController.getPromoSummary
);

// Get promo effectiveness
router.get(
  "/effectiveness/:promoId",
  authenticate,
  hasPermission(["laporan:read"]),
  promoReportController.getPromoEffectiveness
);

// Get discount breakdown
router.get(
  "/discount-breakdown",
  authenticate,
  hasPermission(["laporan:read"]),
  promoReportController.getDiscountBreakdown
);

module.exports = router;
