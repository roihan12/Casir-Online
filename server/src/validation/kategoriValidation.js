const Joi = require("joi");

const CreateKategoriValidation = Joi.object({
  namaKategori: Joi.string().max(100).required(),
  deskripsi: Joi.string().max(200).required(),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});


const UpdateKategoriValidation = Joi.object({
  namaKategori: Joi.string().max(100),
  deskripsi: Joi.string().max(200),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),
});

module.exports = { CreateKategoriValidation, UpdateKategoriValidation };