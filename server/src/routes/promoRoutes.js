const express = require("express");
const promoController = require("../controllers/promoController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// CRUD Routes - require promo:read, promo:create, promo:update, promo:delete
router.post("/", hasPermission(["promo:create"]), promoController.createPromo);

router.put("/:id", hasPermission(["promo:update"]), promoController.updatePromo);

router.delete("/:id", hasPermission(["promo:delete"]), promoController.deletePromo);

router.get("/", hasPermission(["promo:read"]), promoController.getAllPromos);

router.get("/:id", hasPermission(["promo:read"]), promoController.getPromoById);

// Change promo status
router.patch("/:id/status", hasPermission(["promo:update"]), promoController.changePromoStatus);

// Get promo statistics
router.get("/:id/stats", hasPermission(["promo:read"]), promoController.getPromoStats);

// Get eligible products for a promo
router.get("/:id/eligible-products", hasPermission(["promo:read"]), promoController.getEligibleProducts);

// Verify promo codes - for transaction/POS usage
router.post("/verify", hasPermission(["transaksi:create"]), promoController.verifyPromoCode);

router.post("/verify-multiple", hasPermission(["transaksi:create"]), promoController.verifyMultiplePromos);

// Calculate preview for promo application
router.post("/calculate-preview", hasPermission(["transaksi:create"]), promoController.calculatePreview);

// Get eligible promos for a branch - for POS/transaction usage
router.get("/eligible/:cabangId", hasPermission(["transaksi:create"]), promoController.getEligiblePromos);

module.exports = router;
