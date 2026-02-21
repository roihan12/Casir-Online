const express = require("express");
const router = express.Router();
const kuotaCutiController = require("../controllers/kuotaCutiController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== KUOTA CUTI (Leave Quota) MANAGEMENT ==========

router.use(authenticate);

// POST - Generate yearly leave quota for all employees (admin only)
router.post(
  "/generate",
  hasPermission(["kuota_cuti:create"]),
  kuotaCutiController.generateKuotaTahunan
);

// GET - Get all leave quotas (admin/HRD)
router.get(
  "/",
  hasPermission(["kuota_cuti:read"]),
  kuotaCutiController.getAllKuotaCuti
);

// GET - Get leave quota for a specific user
router.get("/:userId", kuotaCutiController.getKuotaCutiByUser);

// PUT - Adjust leave quota manually (HRD only)
router.put(
  "/:id",
  hasPermission(["kuota_cuti:update"]),
  kuotaCutiController.updateKuotaCuti
);

module.exports = router;
