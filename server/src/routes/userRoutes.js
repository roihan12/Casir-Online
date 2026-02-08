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
router.use(authenticate);

router.get(
  "/",
  hasPermission(["user:read"]),
  userController.getAllUsers
);

router.get(
  "/activity-logs",
  hasPermission(["user:read"]),
  userController.getUserActivityLogs
);

router.get(
  "/:id",
  hasPermission(["user:read"]),
  userController.getUserById
);

// Updated user creation route with file upload support
router.post(
  "/",
  hasPermission(["user:create"]),
  handleMulterUpload(upload.single("avatar")),
  userController.createUser
);

router.put(
  "/:id",
  hasPermission(["user:update"]),
  handleMulterUpload(upload.single("avatar")),
  userController.updateUser
);

router.delete(
  "/:id",
  hasPermission(["user:delete"]),
  userController.deleteUser
);

// User status management (activate/deactivate)
router.put(
  "/:id/status",
  hasPermission(["user:update"]),
  userController.changeUserStatus
);

// Password reset
router.post(
  "/:id/reset-password",
  hasPermission(["user:update"]),
  userController.resetUserPassword
);

// Force logout user
router.post(
  "/:id/force-logout",
  hasPermission(["user:manage"]),
  userController.forceUserLogout
);

// Avatar management
router.post(
  "/:id/avatar",
  hasPermission(["user:update"]),
  handleMulterUpload(upload.single("avatar")),
  userController.uploadUserAvatar
);

router.delete(
  "/:id/avatar",
  hasPermission(["user:update"]),
  userController.deleteUserAvatar
);

// User activity logs


// Cache invalidation
router.get(
  "/invalidate-cache/:id?", hasPermission(["user:read"]),
  userController.invalidateCache
);

module.exports = router;
