const Joi = require("joi");

/**
 * Validation schema for clock in
 */
const clockInValidation = Joi.object({
  lokasiAbsensiId: Joi.string().uuid().required().messages({
    "string.guid": "Location ID must be a valid UUID",
    "any.required": "Location ID is required"
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required"
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required"
  }),
  photo: Joi.string().base64().required().messages({
    "string.base64": "Photo must be a valid base64 string",
    "any.required": "Photo is required"
  }),
  frames: Joi.array().items(Joi.string().base64()).optional().messages({
    "array.base": "Frames must be an array"
  })
});

/**
 * Validation schema for clock out
 */
const clockOutValidation = Joi.object({
  lokasiAbsensiId: Joi.string().uuid().required().messages({
    "string.guid": "Location ID must be a valid UUID",
    "any.required": "Location ID is required"
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required"
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required"
  }),
  photo: Joi.string().base64().required().messages({
    "string.base64": "Photo must be a valid base64 string",
    "any.required": "Photo is required"
  }),
  frames: Joi.array().items(Joi.string().base64()).optional().messages({
    "array.base": "Frames must be an array"
  })
});

/**
 * Validation schema for liveness check
 */
const livenessCheckValidation = Joi.object({
  photo: Joi.string().base64().required().messages({
    "string.base64": "Photo must be a valid base64 string",
    "any.required": "Photo is required"
  })
});

/**
 * Validation schema for face registration
 */
const registerFaceValidation = Joi.object({
  photo: Joi.string().base64().required().messages({
    "string.base64": "Photo must be a valid base64 string",
    "any.required": "Photo is required"
  })
});

/**
 * Validation schema for attendance history query
 */
const attendanceHistoryValidation = Joi.object({
  userId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional().messages({
    "date.format": "Start date must be a valid ISO date"
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.format": "End date must be a valid ISO date"
  }),
  status: Joi.string().valid(
    "hadir",
    "terlambat",
    "izin",
    "sakit",
    "cuti",
    "tanpa_keterangan",
    "lembur"
  ).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

/**
 * Validation schema for attendance statistics query
 */
const attendanceStatisticsValidation = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    "date.format": "Start date must be a valid ISO date"
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.format": "End date must be a valid ISO date"
  })
});

/**
 * Validation schema for verify location
 */
const verifyLocationValidation = Joi.object({
  lokasiAbsensiId: Joi.string().uuid().required().messages({
    "string.guid": "Location ID must be a valid UUID",
    "any.required": "Location ID is required"
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required"
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required"
  })
});

module.exports = {
  clockInValidation,
  clockOutValidation,
  livenessCheckValidation,
  registerFaceValidation,
  attendanceHistoryValidation,
  attendanceStatisticsValidation,
  verifyLocationValidation
};
