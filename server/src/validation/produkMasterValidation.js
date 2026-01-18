const Joi = require("joi");

const CreateProdukMasterValidation = Joi.object({
  namaProduk: Joi.string().max(100).required(),
  sku: Joi.string().max(50).required(),
  barcode: Joi.string().max(50).allow(null, ""),
  deskripsi: Joi.string().allow(null, ""),
  kategoriId: Joi.string().required(),
  brand: Joi.string().max(100).allow(null, ""),
  satuan: Joi.string().max(50).allow(null, ""),
  berat: Joi.number().precision(2).allow(null),
  dimensiP: Joi.number().precision(2).allow(null),
  dimensiL: Joi.number().precision(2).allow(null),
  dimensiT: Joi.number().precision(2).allow(null),
  isManagedStock: Joi.boolean().default(false),
  hasExpired: Joi.boolean().default(false),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
  produkImages: Joi.array()
    .items(
      Joi.object({
        fileName: Joi.string().max(255).required(),
        filePath: Joi.string().max(255).required(),
        isPrimary: Joi.boolean().default(false),
        urutan: Joi.number().integer().allow(null),
      })
    )
    .optional(),
});

const UpdateProdukMasterValidation = Joi.object({
  namaProduk: Joi.string().max(100),
  sku: Joi.string().max(50),
  barcode: Joi.string().max(50).allow(null, ""),
  deskripsi: Joi.string().allow(null, ""),
  kategoriId: Joi.string().allow(null, ""),
  brand: Joi.string().max(100).allow(null, ""),
  satuan: Joi.string().max(50).allow(null, ""),
  berat: Joi.number().precision(2).allow(null),
  dimensiP: Joi.number().precision(2).allow(null),
  dimensiL: Joi.number().precision(2).allow(null),
  dimensiT: Joi.number().precision(2).allow(null),
  isManagedStock: Joi.boolean(),
  hasExpired: Joi.boolean(),
  status: Joi.string().valid("aktif", "nonaktif"),
  produkImages: Joi.array()
    .items(
      Joi.object({
        fileName: Joi.string().max(255).required(),
        filePath: Joi.string().max(255).required(),
        isPrimary: Joi.boolean().default(false),
        urutan: Joi.number().integer().allow(null),
      })
    )
    .optional(),
});

module.exports = { CreateProdukMasterValidation, UpdateProdukMasterValidation };
