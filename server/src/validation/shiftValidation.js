const Joi = require("joi");

// Validasi untuk membuka shift baru
const openShiftValidation = Joi.object({
  cabangId: Joi.string().required(),
  kasAwal: Joi.number().precision(2).min(0).required(),
  keterangan: Joi.string().allow(null, ""),
  userId: Joi.string().allow(null, ""),
});

// Validasi untuk menutup shift
const closeShiftValidation = Joi.object({
  shiftId: Joi.string().required(),
  kasAkhir: Joi.number().precision(2).min(0).required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk menyesuaikan shift
const adjustShiftValidation = Joi.object({
  shiftId: Joi.string().required(),
  kasAkhir: Joi.number().precision(2).min(0).required(),
  alasanPenyesuaian: Joi.string().required(),
  selisih: Joi.number().precision(2).required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk mendapatkan daftar shift
const getShiftsValidation = Joi.object({
  cabangId: Joi.string(),
  userId: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  status: Joi.string().valid("dibuka", "ditutup", "disesuaikan"),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

module.exports = {
  openShiftValidation,
  closeShiftValidation,
  adjustShiftValidation,
  getShiftsValidation,
};
