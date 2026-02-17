const Joi = require("joi");

/**
 * Validation schemas for Jadwal Kerja (Work Schedule) Management
 */

// Validation for creating a single schedule
const createJadwalValidation = Joi.object({
  userId: Joi.string().required(),
  cabangId: Joi.string().required(),
  tanggal: Joi.date().required(),
  tipeJadwal: Joi.string().valid("shift", "reguler", "libur", "wfh").default("shift"),
  shiftId: Joi.string().when("tipeJadwal", {
    is: "shift",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  jamMasukOverride: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when("tipeJadwal", {
      is: "reguler",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  jamKeluarOverride: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when("tipeJadwal", {
      is: "reguler",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  keterangan: Joi.string().allow(null, "").optional(),
}).custom((value, helpers) => {
  // Validate that if tipeJadwal is reguler, both jamMasukOverride and jamKeluarOverride are provided
  if (value.tipeJadwal === "reguler") {
    if (!value.jamMasukOverride || !value.jamKeluarOverride) {
      return helpers.error("any.invalid");
    }
  }
  return value;
}).message({
  "any.invalid": "For regular schedule type, both jamMasukOverride and jamKeluarOverride are required",
});

// Validation for generating schedules in bulk
const generateJadwalValidation = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required(),
  cabangId: Joi.string().required(),
  shiftId: Joi.string().required(),
  tanggalMulai: Joi.date().required(),
  tanggalSelesai: Joi.date().greater(Joi.ref("tanggalMulai")).required(),
  hariKerja: Joi.array()
    .items(
      Joi.string().valid("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    )
    .min(1)
    .default(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]),
  tipeJadwal: Joi.string().valid("shift", "reguler", "libur", "wfh").default("shift"),
  skipExisting: Joi.boolean().default(true), // Skip days that already have schedules
});

// Validation for updating a schedule
const updateJadwalValidation = Joi.object({
  tipeJadwal: Joi.string().valid("shift", "reguler", "libur", "wfh").optional(),
  shiftId: Joi.string().when("tipeJadwal", {
    is: Joi.valid("shift"),
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  jamMasukOverride: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when("tipeJadwal", {
      is: "reguler",
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  jamKeluarOverride: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when("tipeJadwal", {
      is: "reguler",
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  keterangan: Joi.string().allow(null, "").optional(),
});

// Validation for querying schedules
const getJadwalValidation = Joi.object({
  userId: Joi.string().optional(),
  cabangId: Joi.string().optional(),
  tanggalMulai: Joi.date().optional(),
  tanggalSelesai: Joi.date().optional(),
  tipeJadwal: Joi.string().valid("shift", "reguler", "libur", "wfh").optional(),
  shiftId: Joi.string().optional(),
  reguId: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

// Validation for jadwal ID parameter
const jadwalIdValidation = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  createJadwalValidation,
  generateJadwalValidation,
  updateJadwalValidation,
  getJadwalValidation,
  jadwalIdValidation,
};
