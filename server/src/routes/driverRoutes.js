const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

// List drivers
router.get("/", driverController.getDrivers);

// Get available drivers
router.get("/available", driverController.getAvailableDrivers);

// Get users not yet linked to any driver (for dropdown)
router.get("/available-users", driverController.getAvailableUsers);

// Create driver
router.post("/", driverController.createDriver);

// Update driver
router.patch("/:id", driverController.updateDriver);

// Delete driver
router.delete("/:id", driverController.deleteDriver);

// Toggle driver status
router.patch("/:id/toggle-status", driverController.toggleDriverStatus);

module.exports = router;
