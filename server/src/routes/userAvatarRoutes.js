const express = require("express");
const router = express.Router();
const userAvatarController = require("../controllers/userAvatarController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadLimiter } = require("../middleware/rateLimiter");
const multer = require("multer");

// Konfigurasi multer untuk upload file
const upload = multer({
  storage: multer.memoryStorage(), // Simpan file di memory dulu (bukan di disk)
  fileFilter: (req, file, cb) => {
    // Hanya terima file gambar
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // Batas ukuran file 2MB
  },
});

// Middleware untuk autentikasi
router.use(authenticate);

// Rute untuk upload avatar
router.post(
  "/upload/:id?",
  uploadLimiter,
  upload.single("avatar"),
  userAvatarController.uploadAvatar
);

// Rute untuk hapus avatar
router.delete("/:id?", userAvatarController.deleteAvatar);

module.exports = router;
