const Joi = require("joi");

const CreateRoleValidation = Joi.object({
  namaRole: Joi.string().max(100).required(),
  deskripsi: Joi.string().max(100).required(),
});

const UpdateRoleValidation = Joi.object({
  namaRole: Joi.string().max(100),
  deskripsi: Joi.string().max(100),
});

module.exports = { CreateRoleValidation, UpdateRoleValidation };