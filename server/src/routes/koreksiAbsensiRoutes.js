const express = require("express");
const router = express.Router();
const koreksiAbsensiController = require("../controllers/koreksiAbsensiController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== KOREKSI ABSENSI (Attendance Correction) MANAGEMENT ==========

router.use(authenticate);

// POST - Submit a new correction request (any authenticated user can submit)
router.post(
  "/",
  koreksiAbsensiController.createKoreksi
);

// GET - Get correction requests (filtered by permissions)
router.get(
  "/",
  koreksiAbsensiController.getKoreksi
);

// GET - Get a single correction request by ID
router.get(
  "/:id",
  koreksiAbsensiController.getKoreksiById
);

// PUT - Approve a correction request (requires approval permission)
router.put(
  "/:id/approve",
  hasPermission(["koreksi:approve"]),
  koreksiAbsensiController.approveKoreksi
);

// PUT - Reject a correction request (requires approval permission)
router.put(
  "/:id/reject",
  hasPermission(["koreksi:approve"]),
  koreksiAbsensiController.rejectKoreksi
);

// DELETE - Cancel a correction request (requester only, no special permission needed)
router.delete(
  "/:id",
  koreksiAbsensiController.cancelKoreksi
);

module.exports = router;
