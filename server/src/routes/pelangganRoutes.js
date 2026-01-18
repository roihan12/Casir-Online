const express = require("express");
const pelangganController = require("../controllers/pelangganController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Create pelanggan
router.post("/", hasPermission(["pelanggan:create"]), pelangganController.createPelanggan);

// Update pelanggan
router.put("/:id", hasPermission(["pelanggan:update"]), pelangganController.updatePelanggan);

// Delete pelanggan
router.delete("/:id", hasPermission(["pelanggan:delete"]), pelangganController.deletePelanggan);

// Get all pelanggan with pagination & search
router.get("/", hasPermission(["pelanggan:read"]), pelangganController.getAllPelanggan);

// Get pelanggan by id
router.get("/:id", hasPermission(["pelanggan:read"]), pelangganController.getPelangganById);

module.exports = router;
