const express = require("express");
const router = express.Router();
const userDashboardController = require("../controllers/userDashboardController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Middleware untuk autentikasi
router.use(authenticate);

// Middleware untuk memeriksa izin pengguna
router.use(hasPermission(["user:read"]));

// Rute dashboard user
router.get("/", userDashboardController.getUserDashboard);
router.get("/stats", userDashboardController.getUserStats);
router.get("/role-distribution", userDashboardController.getRoleDistribution);
router.get("/users-per-cabang", userDashboardController.getUsersPerCabang);
router.get(
  "/breakdown-per-cabang",
  userDashboardController.getBreakdownUserPerCabang
);
router.get("/recent-logins", userDashboardController.getRecentLogins);
router.get("/activities", userDashboardController.getUserActivities);
router.get("/user-performance", userDashboardController.getUserPerformance);
router.get(
  "/active-admin-cabang",
  userDashboardController.getActiveAdminCabang
);

module.exports = router;
