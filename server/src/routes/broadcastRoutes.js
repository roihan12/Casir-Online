const express = require("express");
const router = express.Router();
const broadcastController = require("../controllers/broadcastController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// All routes require authentication
router.use(authenticate);

// Create new broadcast
router.post(
  "/send",
  hasPermission(["marketing:create"]), // Assuming permission exists or use a generic one
  broadcastController.createBroadcast
);

// Get history
router.get(
  "/history",
  hasPermission(["marketing:read"]),
  broadcastController.getBroadcastHistory
);

// Get available segments
router.get(
  "/segments",
  hasPermission(["marketing:read"]),
  broadcastController.getSegments
);

module.exports = router;
