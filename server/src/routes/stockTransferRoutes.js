const express = require("express");
const router = express.Router();
const stockTransferController = require("../controllers/stockTransferController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// ========== STOCK TRANSFER CRUD ==========

router.use(authenticate);

// GET - Mendapatkan statistik transfer stok
router.get(
  "/stats",
  hasPermission(["inventory:read"]),
  stockTransferController.getStockTransferStats
);

// GET - Mendapatkan daftar transfer stok
router.get(
  "/",
  hasPermission(["inventory:read"]),
  stockTransferController.getStockTransfers
);

// GET - Mendapatkan detail transfer stok
router.get(
  "/:id",
  hasPermission(["inventory:read"]),
  stockTransferController.getStockTransferById
);

// POST - Membuat transfer stok baru
router.post(
  "/",
  hasPermission(["inventory:create"]),
  stockTransferController.createStockTransfer
);

// PUT - Update transfer stok (hanya untuk status draft)
router.put(
  "/:id",
  hasPermission(["inventory:update"]),
  stockTransferController.updateStockTransfer
);

// ========== STOCK TRANSFER APPROVAL PROCESS ==========

// PUT - Submit transfer stok for approval
router.put(
  "/:id/submit",
  hasPermission(["inventory:update"]),
  stockTransferController.submitForApproval
);

// PUT - Approve transfer stok
router.put(
  "/:id/approve",
  hasPermission(["inventory:manage"]),
  stockTransferController.approveStockTransfer
);

// PUT - Reject transfer stok
router.put(
  "/:id/reject",
  hasPermission(["inventory:manage"]),
  stockTransferController.rejectStockTransfer
);

// ========== STOCK TRANSFER PROCESS ==========

// PUT - Mengirim transfer stok (mengubah status dari approved ke dikirim)
router.put(
  "/:id/send",
  hasPermission(["inventory:update"]),
  stockTransferController.sendStockTransfer
);

// PUT - Menerima transfer stok (mengubah status dari dikirim ke diterima)
router.put(
  "/:id/receive",
  hasPermission(["inventory:update"]),
  stockTransferController.receiveStockTransfer
);

// PUT - Membatalkan transfer stok
router.put(
  "/:id/cancel",
  hasPermission(["inventory:delete"]),
  stockTransferController.cancelStockTransfer
);

// ========== STOCK TRANSFER REPORTS ==========

// GET - Mendapatkan daftar transfer yang sedang pending untuk cabang
router.get(
  "/pending/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  stockTransferController.getPendingTransfersForBranch
);

// GET - Mendapatkan daftar transfer yang memerlukan approval
router.get(
  "/need-approval",
  hasPermission(["inventory:manage"]),
  stockTransferController.getTransfersNeedingApproval
);

// GET - Mendapatkan riwayat transfer untuk cabang
router.get(
  "/history/:cabangId",
  hasPermission(["inventory:read"], { checkBranch: true }),
  stockTransferController.getTransferHistoryForBranch
);

module.exports = router;
