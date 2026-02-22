const express = require("express");
const router = express.Router();
const {
  clockInController,
  clockOutController,
  livenessCheckController,
  registerFaceController,
  getTodayAttendanceController,
  getAttendanceHistoryController,
  getAttendanceStatisticsController,
  verifyLocationController,
  getFaceStatusController,
} = require("../controllers/absensiController");
const { authenticate } = require("../middleware/authMiddleware");

/**
 * Attendance Routes
 * Base path: /api/attendance
 */

// Employee attendance operations (require authentication)
router.post("/clock-in", authenticate, clockInController);
router.post("/clock-out", authenticate, clockOutController);
router.post("/liveness", authenticate, livenessCheckController);
router.get("/today", authenticate, getTodayAttendanceController);
router.get("/history", authenticate, getAttendanceHistoryController);
router.get("/statistics", authenticate, getAttendanceStatisticsController);
router.post("/verify-location", authenticate, verifyLocationController);

// Face registration (admin can register for users, users can register themselves)
router.post("/register-face", authenticate, registerFaceController);
router.post("/register-face/:userId", authenticate, registerFaceController);

// Face status check
router.get("/face-status/:userId", authenticate, getFaceStatusController);

module.exports = router;
