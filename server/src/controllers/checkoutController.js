const checkoutService = require("../services/checkoutService");
const { validate } = require("../validation/validation");
const {
  checkoutValidation,
  getOrderStatusValidation,
  cancelOrderValidation,
} = require("../validation/checkoutValidation");

/**
 * Create online order
 * POST /api/checkout
 */
const createOrder = async (req, res, next) => {
  try {
    const data = validate(checkoutValidation, req.body);
    const result = await checkoutService.createOnlineOrder(data);

    res.status(201).json({
      status: true,
      message:
        data.payment_method === "PAYMENT_LINK"
          ? "Order berhasil dibuat. Silakan lakukan pembayaran."
          : "Order berhasil dibuat dan dikonfirmasi.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order status
 * GET /api/checkout/:transaksiId/status
 */
const getOrderStatus = async (req, res, next) => {
  try {
    const { transaksiId } = validate(getOrderStatusValidation, {
      transaksiId: req.params.transaksiId,
    });
    const cabangId = req.query.cabangId;

    const result = await checkoutService.getOrderStatus(transaksiId, cabangId);

    res.status(200).json({
      status: true,
      message: "Success get order status",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * POST /api/checkout/:transaksiId/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { transaksiId, alasan } = validate(cancelOrderValidation, {
      transaksiId: req.params.transaksiId,
      alasan: req.body.alasan,
    });
    const cabangId = req.query.cabangId || req.body.cabang_id;

    const result = await checkoutService.cancelOrder(transaksiId, alasan, cabangId);

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderStatus,
  cancelOrder,
};
