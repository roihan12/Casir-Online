const express = require("express");
const router = express.Router();
const penggajianController = require("../controllers/penggajianController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== PENGGAJIAN (Payroll) MANAGEMENT ==========

router.use(authenticate);

// ===== KOMPONEN GAJI (T-17) =====

// GET - List komponen gaji
router.get(
  "/komponen",
  hasPermission(["komponen_gaji:read"]),
  penggajianController.getKomponenGaji
);

// POST - Create komponen gaji
router.post(
  "/komponen",
  hasPermission(["komponen_gaji:create"]),
  penggajianController.createKomponenGaji
);

// GET - Get komponen by ID
router.get(
  "/komponen/:id",
  hasPermission(["komponen_gaji:read"]),
  penggajianController.getKomponenGajiById
);

// PUT - Update komponen
router.put(
  "/komponen/:id",
  hasPermission(["komponen_gaji:update"]),
  penggajianController.updateKomponenGaji
);

// DELETE - Delete komponen
router.delete(
  "/komponen/:id",
  hasPermission(["komponen_gaji:delete"]),
  penggajianController.deleteKomponenGaji
);

// ===== TUNJANGAN PEGAWAI (T-18) =====

// GET - List tunjangan
router.get(
  "/tunjangan",
  hasPermission(["tunjangan:read"]),
  penggajianController.getTunjangan
);

// POST - Add tunjangan to employee
router.post(
  "/tunjangan",
  hasPermission(["tunjangan:create"]),
  penggajianController.createTunjangan
);

// PUT - Update tunjangan
router.put(
  "/tunjangan/:id",
  hasPermission(["tunjangan:update"]),
  penggajianController.updateTunjangan
);

// DELETE - Remove tunjangan
router.delete(
  "/tunjangan/:id",
  hasPermission(["tunjangan:delete"]),
  penggajianController.deleteTunjangan
);

// ===== GAJI PEGAWAI + RIWAYAT (T-19) =====

// GET - Get employee salary data
router.get(
  "/gaji/:userId",
  hasPermission(["gaji:read"]),
  penggajianController.getGajiPegawai
);

// PUT - Update employee salary (creates riwayat automatically)
router.put(
  "/gaji/:userId",
  hasPermission(["gaji:update"]),
  penggajianController.updateGajiPegawai
);

// GET - Get salary history
router.get(
  "/gaji/:userId/riwayat",
  hasPermission(["gaji:read"]),
  penggajianController.getRiwayatGaji
);

// ===== SLIP GAJI (T-20/T-21) =====

// GET - My slip gaji (employee self-view)
router.get("/slip/me", penggajianController.getMySlipGaji);

// POST - Generate slip gaji (batch)
router.post(
  "/slip/generate",
  hasPermission(["slip_gaji:create"]),
  penggajianController.generateSlipGaji
);

// POST - Batch finalize slips
router.post(
  "/slip/batch-finalize",
  hasPermission(["slip_gaji:update"]),
  penggajianController.batchFinalizeSlipGaji
);

// GET - List slip gaji
router.get(
  "/slip",
  hasPermission(["slip_gaji:read"]),
  penggajianController.getSlipGaji
);

// GET - Get slip by ID
router.get(
  "/slip/:id",
  penggajianController.getSlipGajiById
);

// PUT - Finalize a slip (draft → final)
router.put(
  "/slip/:id/finalize",
  hasPermission(["slip_gaji:update"]),
  penggajianController.finalizeSlipGaji
);

// DELETE - Delete draft slip
router.delete(
  "/slip/:id",
  hasPermission(["slip_gaji:delete"]),
  penggajianController.deleteSlipGaji
);

module.exports = router;
