const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { authenticate } = require("../middleware/authMiddleware");

// Public route — tracking timeline
router.get("/orders/:id/tracking", deliveryController.getDeliveryTracking);

// Authenticated routes
router.use(authenticate);

// Admin: list delivery orders
router.get("/orders", deliveryController.getDeliveryOrders);

// Admin: assign driver
router.patch("/orders/:id/assign", deliveryController.assignDriver);

// Driver/Admin: update delivery status
router.patch(
  "/orders/:id/delivery-status",
  deliveryController.updateDeliveryStatus
);

// Driver: mark COD payment received
router.patch(
  "/orders/:id/payment-received",
  deliveryController.markPaymentReceived
);

// Driver/Admin: mark delivery failed
router.patch("/orders/:id/failed", deliveryController.markDeliveryFailed);

// Driver: get active deliveries
router.get(
  "/driver/:driverId/active",
  deliveryController.getDriverActiveDeliveries
);

// Driver: push live location
router.post(
  "/orders/:id/location",
  deliveryController.addDeliveryLocation
);

module.exports = router;
