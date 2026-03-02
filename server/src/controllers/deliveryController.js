const deliveryService = require("../services/deliveryService");
const { validate } = require("../validation/validation");
const {
  assignDriverValidation,
  updateDeliveryStatusValidation,
  paymentReceivedValidation,
  failedDeliveryValidation,
  getDeliveryOrdersValidation,
  driverLocationValidation,
} = require("../validation/deliveryValidation");

/**
 * Get delivery orders for admin dashboard
 */
const getDeliveryOrders = async (req, res, next) => {
  try {
    const cabangId = req.user?.cabangId || req.user?.cabang?.[0]?.cabangId || req.user?.cabang?.[0]?.id || req.query.cabangId;
    if (!cabangId) {
      return res
        .status(400)
        .json({ status: false, errors: "Cabang ID required" });
    }

    const filters = validate(getDeliveryOrdersValidation, {
      status: req.query.status,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });

    const result = await deliveryService.getDeliveryOrders(cabangId, filters);

    res.status(200).json({
      status: true,
      message: "Success get delivery orders",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign driver to order
 */
const assignDriver = async (req, res, next) => {
  try {
    const data = validate(assignDriverValidation, {
      transaksiId: req.params.id,
      driver_id: req.body.driver_id,
    });

    const result = await deliveryService.assignDriver(
      data.transaksiId,
      data.driver_id
    );

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery status (PICKED_UP / DELIVERED)
 */
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const data = validate(updateDeliveryStatusValidation, {
      transaksiId: req.params.id,
      ...req.body,
    });

    const result = await deliveryService.updateDeliveryStatus(
      data.transaksiId,
      data
    );

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * COD: Mark payment as received by driver
 */
const markPaymentReceived = async (req, res, next) => {
  try {
    const data = validate(paymentReceivedValidation, {
      transaksiId: req.params.id,
      ...req.body,
    });

    const result = await deliveryService.markPaymentReceived(
      data.transaksiId,
      data
    );

    res.status(200).json({
      status: true,
      message: result.message,
      data: { kembalian: result.kembalian },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark delivery as failed — return stock
 */
const markDeliveryFailed = async (req, res, next) => {
  try {
    const data = validate(failedDeliveryValidation, {
      transaksiId: req.params.id,
      alasan: req.body.alasan,
    });

    const result = await deliveryService.markDeliveryFailed(
      data.transaksiId,
      data.alasan
    );

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active deliveries for a driver
 */
const getDriverActiveDeliveries = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const result =
      await deliveryService.getDriverActiveDeliveries(driverId);

    res.status(200).json({
      status: true,
      message: "Success get driver active deliveries",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery tracking timeline (public)
 */
const getDeliveryTracking = async (req, res, next) => {
  try {
    const result = await deliveryService.getDeliveryTracking(req.params.id);

    res.status(200).json({
      status: true,
      message: "Success get delivery tracking",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Driver: Add live location to tracking
 */
const addDeliveryLocation = async (req, res, next) => {
  try {
    const data = validate(driverLocationValidation, {
      transaksiId: req.params.id,
      ...req.body,
    });

    const result = await deliveryService.addDeliveryLocation(
      data.transaksiId,
      data
    );

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryOrders,
  assignDriver,
  updateDeliveryStatus,
  markPaymentReceived,
  markDeliveryFailed,
  getDriverActiveDeliveries,
  getDeliveryTracking,
  addDeliveryLocation,
};
