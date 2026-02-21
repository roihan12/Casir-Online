const express = require("express");
const router = express.Router();
const izinController = require("../controllers/izinController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== IZIN & CUTI (Leave Permission & Annual Leave) MANAGEMENT ==========

router.use(authenticate);

// POST - Submit izin request (sakit/keperluan) — any authenticated user
router.post("/izin", izinController.createIzin);

// POST - Submit cuti request (tahunan/melahirkan/bersama/khusus)
router.post("/cuti", izinController.createCuti);

// GET - Get my izin/cuti requests (authenticated user)
router.get("/me", izinController.getMyIzin);

// GET - Get pending requests for approval (admin/approver)
router.get(
  "/pending",
  hasPermission(["izin:approve"]),
  izinController.getPendingIzin
);

// GET - Get izin/cuti list with filters (admin)
router.get(
  "/",
  hasPermission(["izin:read"]),
  izinController.getIzin
);

// GET - Get izin/cuti by ID
router.get("/:id", izinController.getIzinById);

// PUT - Approve izin/cuti (requires permission)
router.put(
  "/:id/approve",
  hasPermission(["izin:approve"]),
  izinController.approveIzin
);

// PUT - Reject izin/cuti (requires permission)
router.put(
  "/:id/reject",
  hasPermission(["izin:approve"]),
  izinController.rejectIzin
);

// DELETE - Cancel own izin/cuti (requester only)
router.delete("/:id", izinController.cancelIzin);

module.exports = router;
