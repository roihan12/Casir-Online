
const Joi = require("joi");

// Validation schema for sending receipt via email
const emailReceiptValidation = Joi.object({
  transaksiId: Joi.string().required(),
  email: Joi.string().email().required(),
  subject: Joi.string().optional(),
  message: Joi.string().optional(),
  format: Joi.string().valid("html", "pdf").default("pdf"),
});

// Validation schema for updating receipt configuration
const updateReceiptConfigValidation = Joi.object({
  headerText: Joi.string().max(255).optional(),
  footerText: Joi.string().max(255).optional(),
  showTaxDetails: Joi.boolean().optional(),
  showCashierName: Joi.boolean().optional(),
  printPaperWidth: Joi.number().min(58).max(210).optional(),
  printAutomatically: Joi.boolean().optional(),
  thankYouMessage: Joi.string().max(255).optional(),
  address: Joi.string().max(255).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  showQrCode: Joi.boolean().optional(),
  logoUrl: Joi.string().uri().optional().allow("", null),
  customCss: Joi.string().optional().allow("", null),
  fontSize: Joi.number().min(8).max(16).optional(),
  language: Joi.string().valid("id", "en").optional(),
});

module.exports = {
  emailReceiptValidation,
  updateReceiptConfigValidation,
};
