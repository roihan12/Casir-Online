const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const { upload, handleMulterError } = require("../middleware/uploadMiddleware");

// Upload a single image to a product
router.post(
  "/products/:id/images",
  authenticate,
  hasPermission(["produk:manage"]),
  upload.single("image"),
  handleMulterError,
  imageController.uploadProdukImage
);

// Set an image as primary
router.put(
  "/products/:productId/images/:imageId/primary",
  authenticate,
  hasPermission(["produk:manage"]),
  imageController.setPrimaryImage
);

// Delete an image
router.delete(
  "/images/:imageId",
  authenticate,
  hasPermission(["produk:manage"]),
  imageController.deleteImage
);

module.exports = router;
