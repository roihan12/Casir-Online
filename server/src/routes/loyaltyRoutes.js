const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyaltyController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// All routes require authentication
router.use(authenticate);

// ================================================================
// CONFIG ROUTES
// ================================================================

// GET /api/loyalty/config - Get loyalty configuration
router.get("/config", hasPermission(["loyalty:read"]), loyaltyController.getConfig);

// POST /api/loyalty/config - Create loyalty configuration
router.post("/config", hasPermission(["loyalty:create"]), loyaltyController.createConfig);

// PUT /api/loyalty/config/:id - Update loyalty configuration
router.put("/config/:id", hasPermission(["loyalty:update"]), loyaltyController.updateConfig);

// ================================================================
// TIER ROUTES
// ================================================================

// GET /api/loyalty/tiers - Get all tiers
router.get("/tiers", hasPermission(["loyalty:read"]), loyaltyController.getAllTiers);

// GET /api/loyalty/tiers/:id - Get tier by ID
router.get("/tiers/:id", hasPermission(["loyalty:read"]), loyaltyController.getTierById);

// POST /api/loyalty/tiers - Create new tier
router.post("/tiers", hasPermission(["loyalty:create"]), loyaltyController.createTier);

// PUT /api/loyalty/tiers/:id - Update tier
router.put("/tiers/:id", hasPermission(["loyalty:update"]), loyaltyController.updateTier);

// DELETE /api/loyalty/tiers/:id - Delete tier
router.delete("/tiers/:id", hasPermission(["loyalty:delete"]), loyaltyController.deleteTier);

// ================================================================
// REWARD ROUTES
// ================================================================

// GET /api/loyalty/rewards - Get all rewards
router.get("/rewards", hasPermission(["loyalty:read"]), loyaltyController.getAllRewards);

// GET /api/loyalty/rewards/:id - Get reward by ID
router.get("/rewards/:id", hasPermission(["loyalty:read"]), loyaltyController.getRewardById);

// POST /api/loyalty/rewards - Create new reward
router.post("/rewards", hasPermission(["loyalty:create"]), loyaltyController.createReward);

// PUT /api/loyalty/rewards/:id - Update reward
router.put("/rewards/:id", hasPermission(["loyalty:update"]), loyaltyController.updateReward);

// DELETE /api/loyalty/rewards/:id - Delete reward
router.delete("/rewards/:id", hasPermission(["loyalty:delete"]), loyaltyController.deleteReward);

// ================================================================
// CUSTOMER LOYALTY ROUTES
// ================================================================

// GET /api/loyalty/customer/:pelangganId - Get customer loyalty info
router.get("/customer/:pelangganId", hasPermission(["loyalty:read"]), loyaltyController.getCustomerLoyaltyInfo);

// GET /api/loyalty/customer/:pelangganId/rewards - Get available rewards for customer
router.get("/customer/:pelangganId/rewards", hasPermission(["loyalty:read"]), loyaltyController.getAvailableRewards);

// GET /api/loyalty/customer/:pelangganId/history - Get points history
router.get("/customer/:pelangganId/history", hasPermission(["loyalty:read"]), loyaltyController.getPointsHistory);

// POST /api/loyalty/redeem - Redeem points for reward
router.post("/redeem", hasPermission(["loyalty:create"]), loyaltyController.redeemReward);

// ================================================================
// STATISTICS ROUTES
// ================================================================

// GET /api/loyalty/stats - Get loyalty statistics
router.get("/stats", hasPermission(["loyalty:read"]), loyaltyController.getLoyaltyStats);

module.exports = router;
