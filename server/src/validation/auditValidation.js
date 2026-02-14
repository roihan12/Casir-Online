const Joi = require("joi");

const getAuditLogsValidation = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().max(100).optional(),
  tableName: Joi.string().max(100).optional(),
  cabangId: Joi.string().optional(),
  page: Joi.number().integer().min(1).max(1000).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const exportAuditLogsValidation = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().max(100).optional(),
  tableName: Joi.string().max(100).optional(),
  cabangId: Joi.string().uuid().optional(),
});

module.exports = {
  getAuditLogsValidation,
  exportAuditLogsValidation,
};
