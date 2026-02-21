const Joi = require("joi");

/**
 * Validation schemas for Hari Libur (Holiday Calendar)
 */

const createHariLiburValidation = Joi.object({
  tanggal: Joi.date().required(),
  nama: Joi.string().min(3).max(100).required(),
  isRecurring: Joi.boolean().default(false),
});

const importHariLiburValidation = Joi.object({
  holidays: Joi.array()
    .items(
      Joi.object({
        tanggal: Joi.date().required(),
        nama: Joi.string().min(3).max(100).required(),
        isRecurring: Joi.boolean().default(false),
      })
    )
    .min(1)
    .max(100)
    .required(),
});

const getHariLiburValidation = Joi.object({
  tahun: Joi.number().integer().min(2020).max(2100).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(50),
});

const checkHariLiburValidation = Joi.object({
  tanggal: Joi.date().required(),
});

const hitungHariKerjaValidation = Joi.object({
  dari: Joi.date().required(),
  sampai: Joi.date().required(),
});

const hariLiburIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createHariLiburValidation,
  importHariLiburValidation,
  getHariLiburValidation,
  checkHariLiburValidation,
  hitungHariKerjaValidation,
  hariLiburIdValidation,
};
