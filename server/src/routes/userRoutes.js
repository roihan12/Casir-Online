const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");
const {
  upload,
  handleMulterUpload,
} = require("../middleware/uploadMiddleware");

// Dynamic permissions for user management
router.get(
  "/",
  authenticate,
  hasPermission(["user:read"]),
  userController.getAllUsers
);

router.get(
  "/:id",
  authenticate,
  hasPermission(["user:read"]),
  userController.getUserById
);

// Updated user creation route with file upload support
router.post(
  "/",
  authenticate,
  hasPermission(["user:create"]),
  handleMulterUpload(upload.single("avatar")),
  userController.createUser
);

router.put(
  "/:id",
  authenticate,
  hasPermission(["user:update"]),
  handleMulterUpload(upload.single("avatar")),
  userController.updateUser
);

router.delete(
  "/:id",
  authenticate,
  hasPermission(["user:delete"]),
  userController.deleteUser
);

// User status management (activate/deactivate)
router.put(
  "/:id/status",
  authenticate,
  hasPermission(["user:update"]),
  userController.changeUserStatus
);

// Password reset
router.post(
  "/:id/reset-password",
  authenticate,
  hasPermission(["user:update"]),
  userController.resetUserPassword
);

// Force logout user
router.post(
  "/:id/force-logout",
  authenticate,
  hasPermission(["user:manage"]),
  userController.forceUserLogout
);

// Avatar management
router.post(
  "/:id/avatar",
  authenticate,
  hasPermission(["user:update"]),
  handleMulterUpload(upload.single("avatar")),
  userController.uploadUserAvatar
);

router.delete(
  "/:id/avatar",
  authenticate,
  hasPermission(["user:update"]),
  userController.deleteUserAvatar
);

// User activity logs
router.get(
  "/activity-logs",
  authenticate,
  hasPermission(["user:read"]),
  userController.getUserActivityLogs
);

// Cache invalidation
router.get(
  "/invalidate-cache/:id?",
  authenticate,
  userController.invalidateCache
);

module.exports = router;
