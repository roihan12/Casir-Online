const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// ========== NOTIFICATION CONFIGURATION ==========

// GET - Mendapatkan konfigurasi notifikasi
router.get(
  "/config/:cabangId",
  hasPermission(["settings:read"], { checkBranch: true }),
  notificationController.getNotificationConfig
);

// PUT - Update konfigurasi notifikasi
router.put(
  "/config",
  hasPermission(["settings:manage"]),
  notificationController.updateNotificationConfig
);

// ========== NOTIFICATION MANAGEMENT ==========

// GET - Mendapatkan daftar notifikasi
router.get(
  "/",
  hasPermission(["notification:read"]),
  notificationController.getNotifications
);

// GET - Mendapatkan statistik notifikasi
router.get(
  "/stats",
  hasPermission(["notification:read"]),
  notificationController.getNotificationStats
);

// POST - Menandai notifikasi telah dibaca
router.post(
  "/read",
  hasPermission(["notification:read"]), // Reading/marking read is a basic read permission action here
  notificationController.markNotificationRead
);

// POST - Mengirim notifikasi manual
router.post(
  "/send",
  hasPermission(["notification:manage"]),
  notificationController.sendManualNotification
);

// ========== NOTIFICATION CHECKS ==========

// POST - Memeriksa stok rendah
router.post(
  "/check/low-stock",
  hasPermission(["notification:manage"]),
  notificationController.checkLowStock
);

// POST - Memeriksa stok yang akan kadaluarsa
router.post(
  "/check/expiring-stock",
  hasPermission(["notification:manage"]),
  notificationController.checkExpiringStock
);

module.exports = router;
