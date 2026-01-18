const Joi = require("joi");

 const createSupplierSchema = Joi.object({
  cabang_id: Joi.string().required(),
  namaSupplier: Joi.string().max(100).required(),
  alamat: Joi.string().allow(null, ""),
  telepon: Joi.string().max(20).allow(null, ""),
  email: Joi.string().email().max(100).allow(null, ""),
  npwp: Joi.string().max(50).allow(null, ""),
  picNama: Joi.string().max(100).allow(null, ""),
  picKontak: Joi.string().max(50).allow(null, ""),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});

 const updateSupplierSchema = createSupplierSchema.fork(
  Object.keys(createSupplierSchema.describe().keys),
  (schema) => schema.optional()
);

module.exports = {
    createSupplierSchema,
    updateSupplierSchema
};