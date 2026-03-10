const crypto = require("crypto");
const { logger } = require("../utils/logger");


/**
 * Middleware to verify Midtrans webhook signature
 * This prevents spoofed webhook requests from unauthorized sources
 */
const verifyMidtransSignature = (req, res, next) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      logger.error("MIDTRANS_SERVER_KEY is not configured");
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured",
      });
    }

    const { order_id, status_code, gross_amount, signature_key } = req.body;

    // Validate required fields for signature verification
    if (!order_id || !status_code || !gross_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required webhook fields",
      });
    }

    if (!signature_key) {
      logger.warn("Midtrans webhook received without signature", { order_id });
      return res.status(400).json({
        success: false,
        message: "Missing signature key",
      });
    }

    // Calculate expected signature
    // Midtrans signature format: SHA512(order_id + status_code + gross_amount + ServerKey)
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (expectedSignature !== signature_key) {
      logger.warn("Invalid Midtrans signature detected", {
        order_id,
        received_signature: signature_key.substring(0, 20) + "...",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Signature verified, proceed to controller
    next();
  } catch (error) {
    logger.error("Midtrans signature verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Signature verification failed",
    });
  }
};

module.exports = { verifyMidtransSignature };
