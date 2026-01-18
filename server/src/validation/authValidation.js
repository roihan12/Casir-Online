const Joi = require("joi");

const loginUserValidation = Joi.object({
  username: Joi.string().max(100).required(),
  password: Joi.string().max(100).required(),
  ip: Joi.string().required(),
  userAgent: Joi.string().required(),
});

module.exports = { loginUserValidation };
