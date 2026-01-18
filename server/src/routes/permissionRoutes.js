const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Get all permissions
router.get("/", authenticate, hasPermission(["permission:read"]), permissionController.getAllPermissions);

// Get permissions by module
router.get(
  "/module/:module",
  authenticate,
  hasPermission(["permission:read"]),
  permissionController.getPermissionsByModule
);

// Get permissions for a specific role
router.get(
  "/role/:roleId",
  authenticate,
  hasPermission(["permission:read"]),
  permissionController.getRolePermissions
);

// Super admin operations for managing permissions (now dynamic)
router.post(
  "/",
  authenticate,
  hasPermission(["permission:create"]),
  permissionController.createPermission
);

router.put(
  "/:permissionId",
  authenticate,
  hasPermission(["permission:update"]),
  permissionController.updatePermission
);

router.delete(
  "/:permissionId",
  authenticate,
  hasPermission(["permission:delete"]),
  permissionController.deletePermission
);

// Assign permission to role
router.post(
  "/assign",
  authenticate,
  hasPermission(["permission:manage"]),
  permissionController.assignPermissionToRole
);

// Bulk assign permissions to role
router.post(
  "/bulk-assign",
  authenticate,
  hasPermission(["permission:manage"]),
  permissionController.bulkAssignPermissionsToRole
);

// Bulk create permissions
router.post(
  "/bulk-create",
  authenticate,
  hasPermission(["permission:manage"]),
  permissionController.bulkCreatePermissions
);

// Remove permission from role
router.delete(
  "/role-permission/:rolePermissionId",
  authenticate,
  hasPermission(["permission:manage"]),
  permissionController.removePermissionFromRole
);

module.exports = router;