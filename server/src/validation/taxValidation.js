const Joi = require("joi");

// Validation schema for tax configuration
const taxConfigSchema = Joi.object({
  is_tax_enabled: Joi.boolean().required(),
  tax_percentage: Joi.number().min(0).max(100).required(),
  tax_name: Joi.string().max(50).required(),
  tax_number: Joi.string().allow("").max(100),
  is_tax_included: Joi.boolean().required(),
});

module.exports = {
  taxConfigSchema,
};
