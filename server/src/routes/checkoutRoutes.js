const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");

// All checkout routes are PUBLIC — no auth required

// Create a new online order
router.post("/", checkoutController.createOrder);

// Get order status (customer tracking)
router.get("/:transaksiId/status", checkoutController.getOrderStatus);

// Cancel order (by customer, only if PENDING)
router.post("/:transaksiId/cancel", checkoutController.cancelOrder);

module.exports = router;
