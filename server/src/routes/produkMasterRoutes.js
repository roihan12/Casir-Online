const express = require("express");
const router = express.Router();
const produkMasterController = require("../controllers/produkMasterController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");
const {
  upload,
  handleMulterUpload,
} = require("../middleware/uploadMiddleware");

// All users can view produk master
router.get("/", authenticate, hasPermission(["produk:read"]), produkMasterController.getAllProdukMaster);
router.get("/:id", authenticate, hasPermission(["produk:read"]), produkMasterController.getProdukMasterById);

// Management operations for produk master
router.post(
  "/",
  authenticate,
  hasPermission(["produk:manage"]),
  handleMulterUpload(upload.array("produkImages", 10)),
  produkMasterController.createProdukMaster
);

router.post(
  "/:id",
  authenticate,
  hasPermission(["produk:manage"]),
  handleMulterUpload(upload.array("produkImages", 10)),
  produkMasterController.uploadProdukImages
);

router.put(
  "/:id",
  authenticate,
  hasPermission(["produk:manage"]),
  handleMulterUpload(upload.array("produkImages", 10)),
  produkMasterController.updateProdukMaster
);
router.delete(
  "/:id",
  authenticate,
  hasPermission(["produk:manage"]),
  produkMasterController.deleteProdukMaster
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  hasPermission(["produk:manage"]),
  produkMasterController.deleteProdukMasterImages
);

module.exports = router;
