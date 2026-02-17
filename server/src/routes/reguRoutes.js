const express = require("express");
const router = express.Router();
const reguController = require("../controllers/reguController");
const { authenticate } = require("../middleware/authMiddleware");

// Semua endpoint butuh autentikasi
router.use(authenticate);

// ═══════════════════════════════════════════════
// REGU CRUD
// ═══════════════════════════════════════════════

/**
 * GET /api/regu
 * List semua regu dengan filter & pagination
 */
router.get("/", reguController.getRegu);

/**
 * POST /api/regu
 * Buat regu baru
 */
router.post("/", reguController.createRegu);

/**
 * GET /api/regu/:reguId
 * Detail regu beserta anggota
 */
router.get("/:reguId", reguController.getReguById);

/**
 * PUT /api/regu/:reguId
 * Update nama/keterangan regu
 */
router.put("/:reguId", reguController.updateRegu);

/**
 * DELETE /api/regu/:reguId
 * Soft delete regu (hanya jika tidak ada anggota)
 */
router.delete("/:reguId", reguController.deleteRegu);

// ═══════════════════════════════════════════════
// REGU MEMBER
// ═══════════════════════════════════════════════

/**
 * GET /api/regu/:reguId/members
 * List anggota regu dengan pagination
 */
router.get("/:reguId/members", reguController.getReguMembers);

/**
 * POST /api/regu/:reguId/members
 * Tambah anggota ke regu (bulk)
 */
router.post("/:reguId/members", reguController.addReguMember);

/**
 * DELETE /api/regu/:reguId/members
 * Hapus anggota dari regu (bulk)
 */
router.delete("/:reguId/members", reguController.removeReguMember);

/**
 * POST /api/regu/members/move
 * Pindah anggota dari regu A ke regu B
 */
router.post("/members/move", reguController.moveReguMember);

module.exports = router;
