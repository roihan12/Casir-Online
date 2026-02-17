const Joi = require("joi");

/**
 * Validation schemas for Master Shift (Work Shift Type) Management
 * Master shifts are reusable shift templates (e.g., "Shift 1", "Shift 2", "Reguler")
 */

// Validation for creating a master shift type
const createMasterShiftValidation = Joi.object({
  namaShift: Joi.string().min(2).max(50).required(),
  jamMasuk: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  jamKeluar: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  toleransiTerlambat: Joi.number().min(0).max(60).default(15),
  cabangId: Joi.string().allow(null, "").optional(),
  keterangan: Joi.string().allow(null, "").optional(),
}).custom((value, helpers) => {
  // Auto-detect isOvernight if jamKeluar < jamMasuk
  const [jamMasukHour, jamMasukMin] = value.jamMasuk.split(':').map(Number);
  const [jamKeluarHour, jamKeluarMin] = value.jamKeluar.split(':').map(Number);

  const jamMasukMinutes = jamMasukHour * 60 + jamMasukMin;
  const jamKeluarMinutes = jamKeluarHour * 60 + jamKeluarMin;

  if (jamKeluarMinutes <= jamMasukMinutes) {
    // Overnight shift
    value.isOvernight = true;
  } else {
    value.isOvernight = false;
  }

  return value;
});

// Validation for updating a master shift type
const updateMasterShiftValidation = Joi.object({
  namaShift: Joi.string().min(2).max(50).optional(),
  jamMasuk: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  jamKeluar: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  toleransiTerlambat: Joi.number().min(0).max(60).optional(),
  cabangId: Joi.string().allow(null, "").optional(),
  keterangan: Joi.string().allow(null, "").optional(),
  isActive: Joi.boolean().optional(),
}).custom((value, helpers) => {
  // Auto-detect isOvernight if both jamMasuk and jamKeluar are provided
  if (value.jamMasuk && value.jamKeluar) {
    const [jamMasukHour, jamMasukMin] = value.jamMasuk.split(':').map(Number);
    const [jamKeluarHour, jamKeluarMin] = value.jamKeluar.split(':').map(Number);

    const jamMasukMinutes = jamMasukHour * 60 + jamMasukMin;
    const jamKeluarMinutes = jamKeluarHour * 60 + jamKeluarMin;

    if (jamKeluarMinutes <= jamMasukMinutes) {
      value.isOvernight = true;
    } else {
      value.isOvernight = false;
    }
  }

  return value;
});

// Validation for querying master shifts
const getMasterShiftsValidation = Joi.object({
  cabangId: Joi.string().allow(null, "").optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

// Validation for master shift ID parameter
const masterShiftIdValidation = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  createMasterShiftValidation,
  updateMasterShiftValidation,
  getMasterShiftsValidation,
  masterShiftIdValidation,
};
