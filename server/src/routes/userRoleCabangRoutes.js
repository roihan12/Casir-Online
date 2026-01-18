const express = require("express");
const userRoleCabangController = require("../controllers/userRoleCabangController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// User Role routes
router.post("/roles", hasPermission(["user:manage"]), userRoleCabangController.assignRoleToUser);
router.delete(
  "/roles/:userRoleId",
  hasPermission(["user:manage"]),
  userRoleCabangController.removeRoleFromUser
);
router.get("/roles/:userId", hasPermission(["user:read"]), userRoleCabangController.getUserRoles);

// User Cabang routes
router.post("/cabang", hasPermission(["user:manage"]), userRoleCabangController.assignUserToCabang);

router.delete(
  "/cabang/:userCabangId",
  hasPermission(["user:manage"]),
  userRoleCabangController.removeUserFromCabang
);
router.put(
  "/cabang/:userCabangId/primary",
  hasPermission(["user:manage"]),
  userRoleCabangController.setPrimaryCabang
);
router.get("/cabang/:userId", hasPermission(["user:read"]), userRoleCabangController.getUserCabang);

module.exports = router;
