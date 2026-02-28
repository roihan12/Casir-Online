const express = require("express");
const router = express.Router();
const paymentWebhookController = require("../controllers/paymentWebhookController");
const {
  verifyMidtransSignature,
} = require("../middleware/midtransSignatureMiddleware");

// Midtrans webhook — verify signature before processing
router.post(
  "/midtrans",
  verifyMidtransSignature,
  paymentWebhookController.handleMidtransWebhook
);

module.exports = router;
