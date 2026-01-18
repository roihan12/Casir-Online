const Joi = require("joi");

const CreatePermissionValidation = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(255).allow(null, ""),
  module: Joi.string().max(50).required(),
  action: Joi.string().valid("create", "read", "update", "delete", "manage").required(),
});

const UpdatePermissionValidation = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(255).allow(null, ""),
  module: Joi.string().max(50),
  action: Joi.string().valid("create", "read", "update", "delete", "manage"),
});

const AssignPermissionValidation = Joi.object({
  roleId: Joi.string().required(),
  permissionId: Joi.string().required(),
});

const BulkAssignPermissionsValidation = Joi.object({
  roleId: Joi.string().required(),
  permissionIds: Joi.array().items(Joi.string()).min(1).required(),
});

const BulkCreatePermissionsValidation = Joi.object({
  permissions: Joi.array().items(CreatePermissionValidation).min(1).required(),
});

module.exports = {
  CreatePermissionValidation,
  UpdatePermissionValidation,
  AssignPermissionValidation,
  BulkAssignPermissionsValidation,
  BulkCreatePermissionsValidation,
};