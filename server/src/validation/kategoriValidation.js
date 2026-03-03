const Joi = require("joi");

const CreateKategoriValidation = Joi.object({
  namaKategori: Joi.string().max(100).trim().required().min(1),
  deskripsi: Joi.string().max(200).optional().allow(""),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});


const UpdateKategoriValidation = Joi.object({
  namaKategori: Joi.string().max(100).trim().min(1),
  deskripsi: Joi.string().max(200),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});

const KategoriIdValidation = Joi.object({
  kategoriId: Joi.string().uuid().required().messages({
    "string.guid": "Kategori ID must be a valid UUID",
    "any.required": "Kategori ID is required",
  }),
});

module.exports = { CreateKategoriValidation, UpdateKategoriValidation, KategoriIdValidation };