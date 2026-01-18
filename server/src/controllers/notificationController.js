const notificationService = require("../services/notificationService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  notificationConfigValidation,
  getNotificationsValidation,
  markNotificationReadValidation,
  sendManualNotificationValidation,
  getNotificationStatsValidation
} = require("../validation/notificationValidation");

// Controller untuk mendapatkan konfigurasi notifikasi
const getNotificationConfig = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId diperlukan");
    }

    const result = await notificationService.getOrCreateNotificationConfig(cabangId);

    res.status(200).json({
      status: true,
      message: "Konfigurasi notifikasi berhasil diambil",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk update konfigurasi notifikasi
const updateNotificationConfig = async (req, res, next) => {
  try {
    const request = validate(notificationConfigValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await notificationService.updateNotificationConfig(
      request,
      {
        userId,
        ipAddress
      }
    );

    res.status(200).json({
      status: true,
      message: "Konfigurasi notifikasi berhasil diperbarui",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar notifikasi
const getNotifications = async (req, res, next) => {
  try {
    const filters = validate(getNotificationsValidation, {
      cabangId: req.query.cabangId,
      type: req.query.type,
      isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    });

    const result = await notificationService.getNotifications(filters);

    res.status(200).json({
      status: true,
      message: "Daftar notifikasi berhasil diambil",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menandai notifikasi telah dibaca
const markNotificationRead = async (req, res, next) => {
  try {
    const request = validate(markNotificationReadValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await notificationService.markNotificationRead(
      request.notificationId,
      {
        userId,
        ipAddress
      }
    );

    res.status(200).json({
      status: true,
      message: "Notifikasi berhasil ditandai telah dibaca",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mengirim notifikasi stok secara manual
const sendManualNotification = async (req, res, next) => {
  try {
    const request = validate(sendManualNotificationValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await notificationService.sendManualNotification(
      request,
      {
        userId,
        ipAddress
      }
    );

    res.status(201).json({
      status: true,
      message: "Notifikasi manual berhasil dikirim",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk memeriksa stok rendah dan mengirim notifikasi
const checkLowStock = async (req, res, next) => {
  try {
    const result = await notificationService.checkLowStock();

    res.status(200).json({
      status: true,
      message: "Pemeriksaan stok rendah berhasil",
      data: {
        notificationsCreated: result.length,
        notifications: result
      }
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk memeriksa stok yang akan kadaluarsa dan mengirim notifikasi
const checkExpiringStock = async (req, res, next) => {
  try {
    const result = await notificationService.checkExpiringStock();

    res.status(200).json({
      status: true,
      message: "Pemeriksaan stok kadaluarsa berhasil",
      data: {
        notificationsCreated: result.length,
        notifications: result
      }
    });
  } catch (error) {
    next(error);
  }
};
// Controller untuk mendapatkan statistik notifikasi
const getNotificationStats = async (req, res, next) => {
  try {
    const filters = validate(getNotificationStatsValidation, {
      cabangId: req.query.cabangId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    const result = await notificationService.getNotificationStats(filters);

    res.status(200).json({
      status: true,
      message: "Statistik notifikasi berhasil diambil",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationConfig,
  updateNotificationConfig,
  getNotifications,
  markNotificationRead,
  sendManualNotification,
  checkLowStock,
  checkExpiringStock,
  getNotificationStats,
};
