const Joi = require("joi");

const createDriverValidation = Joi.object({
  nama: Joi.string().max(100).required().messages({
    "any.required": "Nama driver harus diisi",
  }),
  no_hp: Joi.string()
    .pattern(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .required()
    .messages({
      "any.required": "Nomor HP harus diisi",
      "string.pattern.base": "Format nomor HP tidak valid",
    }),
  email: Joi.string().email().optional().allow(null, ""),
  jenis_kendaraan: Joi.string().max(50).optional().allow(null, ""),
  plat_kendaraan: Joi.string().max(20).optional().allow(null, ""),
  max_delivery_distance: Joi.number().integer().min(0).optional(),
});

const updateDriverValidation = Joi.object({
  nama: Joi.string().max(100).optional(),
  no_hp: Joi.string()
    .pattern(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .optional(),
  email: Joi.string().email().optional().allow(null, ""),
  jenis_kendaraan: Joi.string().max(50).optional().allow(null, ""),
  plat_kendaraan: Joi.string().max(20).optional().allow(null, ""),
  max_delivery_distance: Joi.number().integer().min(0).optional(),
});

module.exports = {
  createDriverValidation,
  updateDriverValidation,
};
