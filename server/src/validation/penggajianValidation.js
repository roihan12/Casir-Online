const Joi = require("joi");

/**
 * Validation schemas for Phase 5 - Komponen Gaji, Tunjangan, Gaji, Slip Gaji
 */

// === T-17: Komponen Gaji ===
const createKomponenGajiValidation = Joi.object({
  nama: Joi.string().min(3).max(100).required(),
  tipe: Joi.string().valid("tunjangan", "potongan").required(),
  nilai: Joi.number().min(0).required(),
  isProrate: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  keterangan: Joi.string().max(500).optional().allow("", null),
});

const updateKomponenGajiValidation = Joi.object({
  nama: Joi.string().min(3).max(100).optional(),
  tipe: Joi.string().valid("tunjangan", "potongan").optional(),
  nilai: Joi.number().min(0).optional(),
  isProrate: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  keterangan: Joi.string().max(500).optional().allow("", null),
});

const getKomponenGajiValidation = Joi.object({
  tipe: Joi.string().valid("tunjangan", "potongan").optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(50),
});

const komponenIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

// === T-18: Tunjangan Pegawai ===
const createTunjanganValidation = Joi.object({
  userId: Joi.string().required(),
  komponenId: Joi.string().uuid().required(),
  nilaiOverride: Joi.number().min(0).optional().allow(null),
  berlakuDari: Joi.date().required(),
  berlakuSampai: Joi.date().min(Joi.ref("berlakuDari")).optional().allow(null),
});

const updateTunjanganValidation = Joi.object({
  nilaiOverride: Joi.number().min(0).optional().allow(null),
  berlakuDari: Joi.date().optional(),
  berlakuSampai: Joi.date().optional().allow(null),
  isActive: Joi.boolean().optional(),
});

const getTunjanganValidation = Joi.object({
  userId: Joi.string().optional(),
  komponenId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const tunjanganIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

// === T-19: Riwayat Gaji ===
const createRiwayatGajiValidation = Joi.object({
  userId: Joi.string().required(),
  gajiPokok: Joi.number().min(0).required(),
  tarifLembur: Joi.number().min(0).default(0),
  berlakuDari: Joi.date().required(),
  berlakuSampai: Joi.date().optional().allow(null),
  alasan: Joi.string().min(5).max(200).required(),
});

const getRiwayatGajiValidation = Joi.object({
  userId: Joi.string().required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
});

// === T-19: Gaji Pegawai (Master) ===
const updateGajiPegawaiValidation = Joi.object({
  gajiPokok: Joi.number().min(0).required(),
  tarifLembur: Joi.number().min(0).default(0),
  tarifHarian: Joi.number().min(0).optional().allow(null),
  tipeGaji: Joi.string().valid("bulanan", "harian").default("bulanan"),
  alasan: Joi.string().min(5).max(200).required(),
});

const gajiPegawaiIdValidation = Joi.object({
  userId: Joi.string().required(),
});

// === T-20/T-21: Slip Gaji ===
const generateSlipGajiValidation = Joi.object({
  periode: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "Format periode harus YYYY-MM" }),
  cabangId: Joi.string().required(),
  userIds: Joi.array().items(Joi.string()).optional(),
});

const getSlipGajiValidation = Joi.object({
  userId: Joi.string().optional(),
  cabangId: Joi.string().optional(),
  periode: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .optional(),
  status: Joi.string().valid("draft", "final", "dibayar").optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const finalizeSlipValidation = Joi.object({
  catatan: Joi.string().max(500).optional().allow("", null),
});

const slipIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  // T-17
  createKomponenGajiValidation,
  updateKomponenGajiValidation,
  getKomponenGajiValidation,
  komponenIdValidation,
  // T-18
  createTunjanganValidation,
  updateTunjanganValidation,
  getTunjanganValidation,
  tunjanganIdValidation,
  // T-19
  createRiwayatGajiValidation,
  getRiwayatGajiValidation,
  updateGajiPegawaiValidation,
  gajiPegawaiIdValidation,
  // T-20/T-21
  generateSlipGajiValidation,
  getSlipGajiValidation,
  finalizeSlipValidation,
  slipIdValidation,
};
