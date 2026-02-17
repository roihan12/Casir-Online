const express = require("express");
const router = express.Router();
const jadwalController = require("../controllers/jadwalController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== JADWAL KERJA (Work Schedule) MANAGEMENT ==========

router.use(authenticate);

// POST - Create a single schedule
router.post(
  "/",
  hasPermission(["jadwal:create"]),
  jadwalController.createJadwal
);

// POST - Generate schedules in bulk
router.post(
  "/generate",
  hasPermission(["jadwal:create"]),
  jadwalController.generateJadwalBulk
);

// POST - Generate schedules in bulk
router.post(
  "/generate/regu/rolling",
  hasPermission(["jadwal:create"]),
  jadwalController.generateJadwalReguRolling
);

// GET - Get schedules with filtering
router.get(
  "/",
  hasPermission(["jadwal:read"]),
  jadwalController.getJadwal
);

// GET - Get a single schedule by ID
router.get(
  "/:id",
  hasPermission(["jadwal:read"]),
  jadwalController.getJadwalById
);

// PUT - Update a schedule
router.put(
  "/:id",
  hasPermission(["jadwal:update"]),
  jadwalController.updateJadwal
);

// DELETE - Delete a schedule
router.delete(
  "/:id",
  hasPermission(["jadwal:delete"]),
  jadwalController.deleteJadwal
);

module.exports = router;
