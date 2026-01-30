const express = require("express");
const router = express.Router();
const transaksiController = require("../controllers/transaksiController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth to all routes
router.use(authenticate);

/**
 * Preview Promo Endpoint
 * Validates promo codes and returns discount calculation WITHOUT creating transaction
 *
 * Request Body:
 * {
 *   "promo_codes": ["PROMO123", "DISCOUNT50"],
 *   "cabang_id": "...",
 *   "pelanggan_id": "...",
 *   "subtotal": 100000,
 *   "metode_pembayaran": "TUNAI"
 * }
 *
 * Response:
 * {
 *   "status": true,
 *   "message": "Promo preview berhasil",
 *   "data": {
 *     "applicable_promos": [...],
 *     "total_discount": 100000,
 *     "errors": [...]
 *   }
 * }
 */
router.post("/preview-promo", hasPermission(["transaksi:create"]), transaksiController.previewPromo);

module.exports = router;
