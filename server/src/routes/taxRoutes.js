const express = require("express");
const router = express.Router();
const taxController = require("../controllers/taxController");
const {authenticate} = require("../middleware/authMiddleware");
const {hasPermission} = require("../middleware/permissionMiddleware");

// All routes require authentication
router.use(authenticate);

// Get tax configuration for a branch
router.get(
  "/config/:cabangId",
  hasPermission(["settings:read"], { checkBranch: true }),
  taxController.getTaxConfig
);

// Update tax configuration for a branch
router.put(
  "/config/:cabangId",
  hasPermission(["settings:manage"], { checkBranch: true }),
  taxController.updateTaxConfig
);

// Calculate tax for an amount
router.post(
  "/calculate",
  hasPermission(["settings:read"]),
  taxController.calculateTax
);

module.exports = router;
