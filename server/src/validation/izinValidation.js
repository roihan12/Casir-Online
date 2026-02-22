const Joi = require("joi");

/**
 * Validation schemas for Izin & Cuti (Leave Request & Approval)
 */

const createIzinValidation = Joi.object({
  tipeIzin: Joi.string()
    .valid("izin_sakit", "izin_keperluan")
    .required(),
  cabangId: Joi.string().required(),
  tanggalMulai: Joi.date().required(),
  tanggalSelesai: Joi.date().min(Joi.ref("tanggalMulai")).required(),
  alasan: Joi.string().min(5).max(500).required(),
  lampiranFile: Joi.string().uri().max(500).optional().allow(null, ""),
});

const createCutiValidation = Joi.object({
  tipeIzin: Joi.string()
    .valid("cuti_tahunan", "cuti_melahirkan", "cuti_bersama", "cuti_khusus")
    .required(),
  cabangId: Joi.string().required(),
  tanggalMulai: Joi.date().required(),
  tanggalSelesai: Joi.date().min(Joi.ref("tanggalMulai")).required(),
  alasan: Joi.string().min(5).max(500).required(),
  lampiranFile: Joi.string().uri().max(500).optional().allow(null, ""),
});

const getIzinValidation = Joi.object({
  userId: Joi.string().optional(),
  cabangId: Joi.string().optional(),
  status: Joi.string().valid("pending", "disetujui", "ditolak", "dibatalkan").optional(),
  tipeIzin: Joi.string()
    .valid("izin_sakit", "izin_keperluan", "cuti_tahunan", "cuti_melahirkan", "cuti_bersama", "cuti_khusus")
    .optional(),
  tanggalMulai: Joi.date().optional(),
  tanggalSelesai: Joi.date().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const approveIzinValidation = Joi.object({
  catatanApprover: Joi.string().max(500).optional().allow(""),
});

const rejectIzinValidation = Joi.object({
  catatanApprover: Joi.string().min(5).max(500).required(),
});

const izinIdValidation = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createIzinValidation,
  createCutiValidation,
  getIzinValidation,
  approveIzinValidation,
  rejectIzinValidation,
  izinIdValidation,
};
