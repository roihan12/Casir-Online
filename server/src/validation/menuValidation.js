const Joi = require("joi");

const CreateMenuValidation = Joi.object({
  name: Joi.string().max(100).required(),
  path: Joi.string().max(255).required(),
  icon: Joi.string().max(100).allow(null, ""),
  parentId: Joi.number().integer().positive().allow(null),
  displayOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
  description: Joi.string().max(255).allow(null, ""),
});

const UpdateMenuValidation = Joi.object({
  name: Joi.string().max(100),
  path: Joi.string().max(255),
  icon: Joi.string().max(100).allow(null, ""),
  parentId: Joi.number().integer().positive().allow(null),
  displayOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
  description: Joi.string().max(255).allow(null, ""),
});

const AssignMenuValidation = Joi.object({
  roleId: Joi.number().integer().positive().required(),
  menuId: Joi.number().integer().positive().required(),
});

const BulkAssignMenusValidation = Joi.object({
  roleId: Joi.number().integer().positive().required(),
  menuIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

module.exports = {
  CreateMenuValidation,
  UpdateMenuValidation,
  AssignMenuValidation,
  BulkAssignMenusValidation,
};