const express = require("express");
const router = express.Router();
const multer = require("multer");
const ocrController = require("../controllers/ocrController");
const { authenticate } = require("../middleware/authMiddleware");

// Setup multer untuk memory storage agar file langsung di forward tanpa simpan server lokal
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diizinkan!"), false);
    }
  },
});

router.use(authenticate);

// POST - Extract Invoice Data
router.post(
  "/extract-invoice",
  upload.single("image"),
  ocrController.extractInvoice
);

router.post("/map-invoice", ocrController.mapInvoice);
router.post("/save-mapping", ocrController.saveInvoiceMapping);

module.exports = router;
