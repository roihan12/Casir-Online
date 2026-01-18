const Joi = require("joi");

// Validation for creating a credit recommendation
const createKreditRekomendasiValidation = Joi.object({
  pelangganId: Joi.string().required(),
});

// Validation for approving/rejecting a credit recommendation
const approveKreditRekomendasiValidation = Joi.object({
  statusPersetujuan: Joi.string().valid("disetujui", "ditolak").required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validation for getting credit recommendations list
const getKreditRekomendasiListValidation = Joi.object({
  cabangId: Joi.string(),
  statusPersetujuan: Joi.string().valid("pending", "disetujui", "ditolak"),
  minSkorKredit: Joi.number().min(0).max(100),
  maxSkorKredit: Joi.number().min(0).max(100),
  search: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

// Validation for creating a credit transaction
const createKreditTransaksiValidation = Joi.object({
  transaksiId: Joi.string().required(),
  kreditSettingId: Joi.string().required(),
  jumlahKredit: Joi.number().precision(2).min(0).required(),
  tenor: Joi.number().integer().min(1).required(),
  bunga: Joi.number().precision(2).min(0),
  biayaAdmin: Joi.number().precision(2).min(0),
  tanggalMulai: Joi.date().default(new Date()),
  tanggalJatuhTempo: Joi.date().required(),
  keterangan: Joi.string().allow(null, ""),
});

module.exports = {
  createKreditRekomendasiValidation,
  approveKreditRekomendasiValidation,
  getKreditRekomendasiListValidation,
  createKreditTransaksiValidation,
};
