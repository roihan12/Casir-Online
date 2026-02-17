const Joi = require("joi");

/**
 * Validation schemas for Attendance Correction (Koreksi Absensi)
 */

// Validation for submitting a correction request
const createKoreksiValidation = Joi.object({
  absensiId: Joi.string().required(),
  alasan: Joi.string().min(10).max(500).required(),
  waktuMasukBaru: Joi.date().optional().allow(null),
  waktuKeluarBaru: Joi.date().optional().allow(null),
  statusBaru: Joi.string().valid(
    "hadir",
    "hadir_terlambat",
    "hadir_pulang_cepat",
    "izin_sakit",
    "izin_keperluan",
    "cuti",
    "alpha",
    "libur",
    "off",
    "wfh",
    "dinas_luar"
  ).optional(),
}).custom((value, helpers) => {
  // Validate that at least one field is being corrected
  if (!value.waktuMasukBaru && !value.waktuKeluarBaru && !value.statusBaru) {
    return helpers.error("any.invalid", {
      message: "At least one correction field (waktuMasukBaru, waktuKeluarBaru, or statusBaru) must be provided",
    });
  }

  // Validate waktuMasukBaru < waktuKeluarBaru if both provided
  if (value.waktuMasukBaru && value.waktuKeluarBaru) {
    if (value.waktuMasukBaru >= value.waktuKeluarBaru) {
      return helpers.error("any.invalid", {
        message: "waktuMasukBaru must be earlier than waktuKeluarBaru",
      });
    }
  }

  return value;
});

// Validation for approving a correction
const approveKoreksiValidation = Joi.object({
  catatanApprover: Joi.string().max(500).optional(),
});

// Validation for rejecting a correction
const rejectKoreksiValidation = Joi.object({
  catatanApprover: Joi.string().min(5).max(500).required(),
});

// Validation for querying correction requests
const getKoreksiValidation = Joi.object({
  userId: Joi.string().optional(),
  cabangId: Joi.string().optional(),
  status: Joi.string().valid("pending", "disetujui", "ditolak", "dibatalkan").optional(),
  tanggalMulai: Joi.date().optional(),
  tanggalSelesai: Joi.date().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

// Validation for koreksi ID parameter
const koreksiIdValidation = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  createKoreksiValidation,
  approveKoreksiValidation,
  rejectKoreksiValidation,
  getKoreksiValidation,
  koreksiIdValidation,
};
