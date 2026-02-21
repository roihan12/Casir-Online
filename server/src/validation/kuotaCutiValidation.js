const Joi = require("joi");

/**
 * Validation schemas for Kuota Cuti (Leave Quota)
 */

const getKuotaCutiValidation = Joi.object({
  tahun: Joi.number().integer().min(2020).max(2100).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const userIdValidation = Joi.object({
  userId: Joi.string().required(),
});

const generateKuotaValidation = Joi.object({
  tahun: Joi.number().integer().min(2020).max(2100).required(),
  kuotaDefault: Joi.number().integer().min(0).max(30).default(12),
  carryOver: Joi.boolean().default(false),
  maxCarryOver: Joi.number().integer().min(0).max(30).default(5),
});

const updateKuotaValidation = Joi.object({
  kuotaTahunan: Joi.number().integer().min(0).max(60).optional(),
  kuotaDiambil: Joi.number().integer().min(0).optional(),
  kuotaPending: Joi.number().integer().min(0).optional(),
  alasan: Joi.string().min(5).max(200).required(),
});

const kuotaIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  getKuotaCutiValidation,
  userIdValidation,
  generateKuotaValidation,
  updateKuotaValidation,
  kuotaIdValidation,
};
