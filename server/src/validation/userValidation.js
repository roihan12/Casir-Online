const Joi = require("joi");

const userCreateSchema = Joi.object({
  username: Joi.string().max(50).required(),
  password: Joi.string().min(6).max(255).required(),
  namaLengkap: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  telepon: Joi.string().max(20).allow(null, ""),
  avatarUrl: Joi.string().max(255).allow(null, ""),
  status: Joi.string().valid("aktif", "nonaktif").default("aktif"),

  // Validate related data
  userRoles: Joi.array()
    .items(
      Joi.object({
        roleId: Joi.string().required(),
        cabangId: Joi.string().required(),
      })
    )
    .min(1)
    .required(),

  userCabang: Joi.array()
    .items(
      Joi.object({
        cabangId: Joi.string().required(),
        isPrimary: Joi.boolean().default(false),
      })
    )
    .min(1)
    .required(),
});

const userUpdateSchema = Joi.object({
  username: Joi.string().max(50),
  password: Joi.string().min(6).max(255),
  namaLengkap: Joi.string().max(100),
  email: Joi.string().email().max(100),
  telepon: Joi.string().max(20).allow(null, ""),
  avatarUrl: Joi.string().max(255).allow(null, ""),
  status: Joi.string().valid("aktif", "nonaktif"),

  // Validate related data
  userRoles: Joi.array().items(
    Joi.object({
      roleId: Joi.string().required(),
      cabangId: Joi.string().required(),
    })
  ),

  userCabang: Joi.array().items(
    Joi.object({
      cabangId: Joi.string().required(),
      isPrimary: Joi.boolean().default(false),
    })
  ),
}).min(1); // At least one field must be provided for update

// Schema for validating role assignment to user
const userRoleAssignSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "User ID must be a valid UUID",
    "any.required": "User ID is required",
  }),
  roleId: Joi.string().uuid().required().messages({
    "string.uuid": "Role ID must be a valid UUID",
    "any.required": "Role ID is required",
  }),
  cabangId: Joi.string().required().messages({
    "string.uuid": "Cabang ID must be a valid UUID",
    "any.required": "Cabang ID is required",
  }),
});

// Schema for validating branch assignment to user
const userCabangAssignSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "User ID must be a valid UUID",
    "any.required": "User ID is required",
  }),
  cabangId: Joi.string().required().messages({
    "string.uuid": "Cabang ID must be a valid UUID",
    "any.required": "Cabang ID is required",
  }),
  isPrimary: Joi.boolean().default(false).messages({
    "boolean.base": "Is Primary must be a boolean value",
  }),
});

// Schema for validating user status change
const userStatusChangeSchema = Joi.object({
  status: Joi.string().valid("aktif", "nonaktif").required().messages({
    "any.only": "Status must be either 'aktif' or 'nonaktif'",
    "any.required": "Status is required",
  }),
  alasan: Joi.string().allow(null, ""),
});

// Schema for validating password reset
const passwordResetSchema = Joi.object({
  newPassword: Joi.string().min(6).max(255).required().messages({
    "string.min": "New password must be at least 6 characters long",
    "string.max": "New password must be less than 255 characters",
    "any.required": "New password is required",
  }),
  forceLogout: Joi.boolean().default(true),
});

// Schema for validating user activity log filters
const userActivityLogSchema = Joi.object({
  userId: Joi.string().uuid(),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref("startDate")),
  action: Joi.string(),
  tableName: Joi.string(),
  ipAddress: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

module.exports = {
  userCreateSchema,
  userUpdateSchema,
  userRoleAssignSchema,
  userCabangAssignSchema,
  userStatusChangeSchema,
  passwordResetSchema,
  userActivityLogSchema,
};
