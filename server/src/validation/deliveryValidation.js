const Joi = require("joi");

const assignDriverValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  driver_id: Joi.string().uuid().required().messages({
    "any.required": "Driver ID harus diisi",
  }),
});

const updateDeliveryStatusValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  status: Joi.string()
    .valid("PICKED_UP", "DELIVERED")
    .required()
    .messages({
      "any.only": "Status harus PICKED_UP atau DELIVERED",
    }),
  notes: Joi.string().max(500).optional().allow(null, ""),
  latitude: Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null),
  photo_url: Joi.string().uri().optional().allow(null, ""),
});

const paymentReceivedValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  jumlah_bayar: Joi.number().min(0).required(),
  notes: Joi.string().max(500).optional().allow(null, ""),
});

const failedDeliveryValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  alasan: Joi.string().max(500).required().messages({
    "any.required": "Alasan gagal kirim harus diisi",
  }),
});

const getDeliveryOrdersValidation = Joi.object({
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "ASSIGNED", "PICKED_UP", "ALL")
    .optional()
    .default("ALL"),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(20),
});

const driverLocationValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

const driverHistoryValidation = Joi.object({
  status: Joi.string()
    .valid("DELIVERED", "FAILED", "CANCELLED", "ALL")
    .optional()
    .default("ALL"),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(20),
});

module.exports = {
  assignDriverValidation,
  updateDeliveryStatusValidation,
  paymentReceivedValidation,
  failedDeliveryValidation,
  getDeliveryOrdersValidation,
  driverLocationValidation,
  driverHistoryValidation,
};
