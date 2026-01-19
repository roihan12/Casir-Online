const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== SHIFT MANAGEMENT ==========

router.use(authenticate);

// POST - Membuka shift baru
router.post(
  "/open",
  hasPermission(["shift:create"]),
  shiftController.openShift
);

// POST - Menutup shift
router.post(
  "/close",
  hasPermission(["shift:update"]),
  shiftController.closeShift
);

// POST - Menyesuaikan shift
router.post(
  "/adjust",
  hasPermission(["shift:update"]),
  shiftController.adjustShift
);

// GET - Mendapatkan shift aktif
router.get(
  "/active",
  hasPermission(["shift:read"]),
  shiftController.getActiveShift
);

// GET - Mendapatkan detail shift
router.get(
  "/:id",
  hasPermission(["shift:read"]),
  shiftController.getShiftById
);

// GET - Mendapatkan daftar shift
router.get(
  "/",
  hasPermission(["shift:read"]),
  shiftController.getShifts
);

// GET - Mendapatkan laporan shift
router.get(
  "/reports/summary",
  hasPermission(["shift:read"]),
  shiftController.getShiftReport
);

module.exports = router;
