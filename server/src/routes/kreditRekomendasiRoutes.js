const express = require("express");
const router = express.Router();
const kreditRekomendasiController = require("../controllers/kreditRekomendasiController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Create credit recommendation
router.post("/", kreditRekomendasiController.createKreditRekomendasi);

// Get credit recommendation by ID
router.get("/:id", kreditRekomendasiController.getKreditRekomendasiById);

// Get credit recommendations by customer
router.get("/pelanggan/:pelangganId", kreditRekomendasiController.getKreditRekomendasiByPelanggan);

// Approve or reject credit recommendation
router.put("/:id/approve", kreditRekomendasiController.approveKreditRekomendasi);

// Get list of credit recommendations with filters
router.get("/", kreditRekomendasiController.getKreditRekomendasiList);

// Get customer credit score
router.get("/score/:pelangganId", kreditRekomendasiController.getCustomerCreditScore);

module.exports = router;
