const express = require("express");
const router = express.Router();
const masterShiftController = require("../controllers/masterShiftController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== MASTER SHIFT MANAGEMENT (Work Shift Types) ==========

router.use(authenticate);

// POST - Create a new master shift type
router.post(
  "/",
  hasPermission(["shift:create"]),
  masterShiftController.createMasterShift
);

// GET - Get all master shifts with filtering
router.get(
  "/",
  hasPermission(["shift:read"]),
  masterShiftController.getMasterShifts
);

// GET - Get a single master shift by ID
router.get(
  "/:id",
  hasPermission(["shift:read"]),
  masterShiftController.getMasterShiftById
);

// PUT - Update a master shift
router.put(
  "/:id",
  hasPermission(["shift:update"]),
  masterShiftController.updateMasterShift
);

// DELETE - Soft delete (deactivate) a master shift
router.delete(
  "/:id",
  hasPermission(["shift:delete"]),
  masterShiftController.deleteMasterShift
);

module.exports = router;
