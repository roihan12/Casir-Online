const Joi = require("joi");

// Validasi untuk produk batch
const createProductBatchValidation = Joi.object({
  produkId: Joi.string().required(),
  batchNumber: Joi.string().required(),
  expiredDate: Joi.date().allow(null),
  quantity: Joi.number().integer().min(1).required(),
  hargaBeli: Joi.number().precision(2).min(0).required(),
  hargaJual: Joi.number().precision(2).min(0),
  hargaGrosir: Joi.number().precision(2).min(0),
  supplierId: Joi.string().allow(null, ""),
  dokumenReferensi: Joi.string().allow(null, ""),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk stok kadaluarsa
const getExpiringStockValidation = Joi.object({
  cabangId: Joi.string().required(),
  daysThreshold: Joi.number().integer().min(1).default(30),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Validasi untuk stok minimum
const getMinimumStockValidation = Joi.object({
  cabangId: Joi.string().required(),
  kategoriId: Joi.string().allow(null, ""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Validasi untuk stock alert settings
const updateStockAlertSettingsValidation = Joi.object({
  produkId: Joi.string().required(),
  cabangId: Joi.string().required(),
  minStok: Joi.number().integer().min(0).allow(null),
  maxStok: Joi.number().integer().min(0).allow(null),
  notifyLowStock: Joi.boolean().default(true),
  notifyExpiringStock: Joi.boolean().default(true),
  expiryThresholdDays: Joi.number().integer().min(1).allow(null),
});

module.exports = {
  createProductBatchValidation,
  getExpiringStockValidation,
  getMinimumStockValidation,
  updateStockAlertSettingsValidation,
};
