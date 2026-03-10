const qrisService = require("../services/qrisService");
const transaksiService = require("../services/transaksiService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { qrisPaymentValidation } = require("../validation/transaksiValidation");
const { logger } = require("../utils/logger");


// Controller untuk membuat QRIS payment
const createQrisPayment = async (req, res, next) => {
  try {
    const request = validate(qrisPaymentValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await transaksiService.createQrisPayment(request, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Pembayaran QRIS berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk callback dari Midtrans
const handleQrisCallback = async (req, res, next) => {
  try {
    const notificationData = req.body;

    // Handle QRIS notification from Midtrans
    const result = await qrisService.handleQrisCallback(notificationData);

    // Return 200 status as required by Midtrans
    res.status(200).json({ status: "OK", data: result });
  } catch (error) {
    // Log the error but still return 200 to Midtrans to prevent retries
    logger.error("QRIS Callback Error:", error);
    res.status(200).json({ status: "ERROR", message: error.message });
  }
};

// Controller untuk cek status QRIS payment
const checkQrisStatus = async (req, res, next) => {
  try {
    const { reference_id } = req.params;

    if (!reference_id) {
      throw new ResponseError(400, "reference_id is required");
    }

    const result = await qrisService.checkQrisStatus(reference_id);

    res.status(200).json({
      status: true,
      message: "Success get QRIS payment status",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membatalkan QRIS payment
const cancelQrisPayment = async (req, res, next) => {
  try {
    const { reference_id } = req.params;

    if (!reference_id) {
      throw new ResponseError(400, "reference_id is required");
    }

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await qrisService.cancelQrisPayment(reference_id);

    res.status(200).json({
      status: true,
      message: "QRIS payment canceled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQrisPayment,
  handleQrisCallback,
  checkQrisStatus,
  cancelQrisPayment,
};
