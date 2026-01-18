const Joi = require("joi");

const CreateCabangValidation = Joi.object({
  namaCabang: Joi.string().max(100).required(),
  alamat: Joi.string().max(200).required(),
  telepon: Joi.string().max(20).required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  radiusGeofence: Joi.number(),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});


const UpdateCabangValidation = Joi.object({
  namaCabang: Joi.string().max(100),
  alamat: Joi.string().max(200),
  telepon: Joi.string().max(20),
  latitude: Joi.number(),
  longitude: Joi.number(),
  radiusGeofence: Joi.number(),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});

module.exports = { CreateCabangValidation, UpdateCabangValidation };