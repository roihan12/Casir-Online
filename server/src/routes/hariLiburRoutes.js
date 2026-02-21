const express = require("express");
const router = express.Router();
const hariLiburController = require("../controllers/hariLiburController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== HARI LIBUR (Holiday Calendar) MANAGEMENT ==========

router.use(authenticate);

// GET - Check if a specific date is a holiday (must be before /:id)
router.get("/check", hariLiburController.checkHariLibur);

// GET - Calculate working days between two dates
router.get("/hitung-hari-kerja", hariLiburController.hitungHariKerja);

// GET - List holidays
router.get("/", hariLiburController.getHariLibur);

// POST - Create a holiday (admin only)
router.post(
  "/",
  hasPermission(["hari_libur:create"]),
  hariLiburController.createHariLibur
);

// POST - Bulk import holidays (admin only)
router.post(
  "/import",
  hasPermission(["hari_libur:create"]),
  hariLiburController.importHariLibur
);

// DELETE - Delete a holiday (admin only)
router.delete(
  "/:id",
  hasPermission(["hari_libur:delete"]),
  hariLiburController.deleteHariLibur
);

module.exports = router;
