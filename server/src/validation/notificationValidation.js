const Joi = require("joi");

// Validasi untuk konfigurasi notifikasi
const notificationConfigValidation = Joi.object({
  cabangId: Joi.string().required(),
  lowStockThresholdDays: Joi.number().integer().min(1).default(7),
  expiryThresholdDays: Joi.number().integer().min(1).default(30),
  enableEmailNotification: Joi.boolean().default(true),
  enableAppNotification: Joi.boolean().default(true),
  emailRecipients: Joi.string().allow(null, ""),
});

// Validasi untuk mendapatkan notifikasi
const getNotificationsValidation = Joi.object({
  cabangId: Joi.string(),
  type: Joi.string().valid(
    "LOW_STOCK",
    "EXPIRING_STOCK",
    "STOCK_OUT",
    "OVERSTOCK"
  ).allow(null, ""),
  isRead: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Validasi untuk menandai notifikasi telah dibaca
const markNotificationReadValidation = Joi.object({
  notificationId: Joi.string().required(),
});

// Validasi untuk mengirim notifikasi manual
const sendManualNotificationValidation = Joi.object({
  cabangId: Joi.string().required(),
  produkId: Joi.string().required(),
  type: Joi.string()
    .valid("LOW_STOCK", "EXPIRING_STOCK", "STOCK_OUT", "OVERSTOCK")
    .required(),
  message: Joi.string().required(),
  details: Joi.string().allow(null, ""),
});

// Validasi untuk mendapatkan statistik notifikasi
const getNotificationStatsValidation = Joi.object({
  cabangId: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
});

module.exports = {
  notificationConfigValidation,
  getNotificationsValidation,
  markNotificationReadValidation,
  sendManualNotificationValidation,
  getNotificationStatsValidation,
};
