const express = require("express");
const { getProductDashboardStats } = require("../controllers/productMasterDashboardController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get product dashboard statistics
router.get("/stats", getProductDashboardStats);

module.exports = router;