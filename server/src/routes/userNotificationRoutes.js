const express = require("express");
const router = express.Router();
const userNotificationController = require("../controllers/userNotificationController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// GET - Mendapatkan daftar notifikasi user
router.get("/", userNotificationController.getUserNotifications);

// PUT - Menandai semua notifikasi sebagai telah dibaca
router.put("/read-all", userNotificationController.markAllAsRead);

// PUT - Menandai satu notifikasi tertentu sebagai telah dibaca
router.put("/:id/read", userNotificationController.markAsRead);

module.exports = router;
