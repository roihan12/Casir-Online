const Joi = require("joi");

const getInventoryDashboardValidation = Joi.object({
  cabangId: Joi.string().optional(),
  period: Joi.string().optional(),
});

module.exports = {
  getInventoryDashboardValidation
};
