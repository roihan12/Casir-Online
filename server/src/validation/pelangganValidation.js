const Joi = require("joi");
const { cabang } = require("../config/db");

 const createPelangganSchema = Joi.object({
  cabang_id: Joi.string().required(),
  namaPelanggan: Joi.string().max(100).required(),
  alamat: Joi.string().allow(null, ""),
  telepon: Joi.string().max(20).allow(null, ""),
  email: Joi.string().email().max(100).allow(null, ""),
  tanggalLahir: Joi.date().allow(null),
  gender: Joi.string().valid("male", "female").allow(null),
  poin: Joi.number().integer().allow(null),
  segmen: Joi.string().valid("silver", "gold", "platinum").allow(null),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});

 const updatePelangganSchema = createPelangganSchema.fork(
  Object.keys(createPelangganSchema.describe().keys),
  (schema) => schema.optional()
);

module.exports = {
    createPelangganSchema,
    updatePelangganSchema
}