const express = require("express");
const router = express.Router();
const KasirController = require("../controllers/kasirController");
const { body, param, query } = require("express-validator");
const {authenticate} = require("../middleware/authMiddleware");
const {hasPermission} = require("../middleware/permissionMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard data
router.get("/dashboard", hasPermission(["transaksi:read"]), KasirController.getDashboard);

// Shift management
router.get("/shift/active", hasPermission(["shift:read"]), KasirController.getActiveShift);
router.post(
  "/shift/open",
  [
    body("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
    body("kasAwal").isNumeric().withMessage("Kas awal harus berupa angka"),
  ],
  hasPermission(["shift:manage"], { checkBranch: true }),
  KasirController.openShift
);
router.post(
  "/shift/close",
  [
    body("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
    body("kasAkhir").isNumeric().withMessage("Kas akhir harus berupa angka"),
  ],
  hasPermission(["shift:manage"], { checkBranch: true }),
  KasirController.closeShift
);
router.get("/shifts", hasPermission(["shift:read"]), KasirController.getShiftsHistory);

// Product search and retrieval
router.get(
  "/products/search",
  [
    query("query").notEmpty().withMessage("Query pencarian wajib diisi"),
    query("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
  ],
  hasPermission(["produk:read"], { checkBranch: true }),
  KasirController.searchProducts
);
router.get(
  "/products/code/:code",
  [
    param("code").notEmpty().withMessage("Kode produk wajib diisi"),
    query("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
  ],
  hasPermission(["produk:read"], { checkBranch: true }),
  KasirController.getProductByCode
);

// Customer search
router.get(
  "/customers/search",
  [
    query("query").notEmpty().withMessage("Query pencarian wajib diisi"),
    query("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
  ],
  hasPermission(["pelanggan:read"], { checkBranch: true }),
  KasirController.searchCustomers
);

// Transaction management
router.post(
  "/transactions",
  [
    body("cabangId").notEmpty().withMessage("Cabang ID wajib diisi"),
    body("shiftId").notEmpty().withMessage("Shift ID wajib diisi"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("Minimal satu item wajib diisi"),
    body("subtotal").isNumeric().withMessage("Subtotal harus berupa angka"),
    body("total").isNumeric().withMessage("Total harus berupa angka"),
    body("metodePembayaran")
      .notEmpty()
      .withMessage("Metode pembayaran wajib diisi"),
    body("jumlahBayar")
      .isNumeric()
      .withMessage("Jumlah bayar harus berupa angka"),
  ],
  hasPermission(["transaksi:create"], { checkBranch: true }),
  KasirController.createTransaction
);
// Penting: rute spesifik harus didefinisikan sebelum rute dengan parameter dinamis
router.get("/transactions/recent", hasPermission(["transaksi:read"]), KasirController.getRecentTransactions);
router.get("/transactions/:id", hasPermission(["transaksi:read"]), KasirController.getTransactionDetails);

// Receipt management
router.post("/receipts/print/:id", hasPermission(["transaksi:read"]), KasirController.printReceipt);
router.get("/receipts/config", hasPermission(["settings:read"]), KasirController.getReceiptConfig);

// Reports
router.get("/reports/daily", hasPermission(["report:read"]), KasirController.getDailySummary);

module.exports = router;
