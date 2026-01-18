const express = require("express");
const router = express.Router();
const kategoriController = require("../controllers/kategoriController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

router.get("/", authenticate, hasPermission(["kategori:read"]), kategoriController.getAllKategori);

router.get("/:kategoriId", authenticate, hasPermission(["kategori:read"]), kategoriController.getKategoriById);

// Category management operations
router.post(
  "/",
  authenticate,
  hasPermission(["kategori:manage"]),
  kategoriController.createKategori
);
router.put(
  "/:kategoriId",
  authenticate,
  hasPermission(["kategori:manage"]),
  kategoriController.updateKategori
);
router.delete(
  "/:kategoriId",
  authenticate,
  hasPermission(["kategori:manage"]),
  kategoriController.deleteKategori
);

module.exports = router;
