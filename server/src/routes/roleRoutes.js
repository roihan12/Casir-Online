const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Get all role that user has access to
router.get("/", authenticate, roleController.getAllRole);

// Get specific role
router.get(
  "/:roleId",
  authenticate,
  roleController.getRoleById
);

// Super admin operations (now dynamic)
router.post(
  "/",
  authenticate,
  hasPermission(["role:create"]),
  roleController.createRole
);

// Clone role with permissions
router.post(
  "/:roleId/clone",
  authenticate,
  hasPermission(["role:create"]),
  roleController.cloneRole
);

router.put(
  "/:roleId",
  authenticate,
  hasPermission(["role:update"]),
  roleController.updateRole
);
router.delete(
  "/:roleId",
  authenticate,
  hasPermission(["role:delete"]),
  roleController.deleteRole
);

module.exports = router;

