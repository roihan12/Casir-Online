const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authenticate } = require("../middleware/authMiddleware");
const {
  downloadTemplate,
  previewImport,
  importData,
} = require("../controllers/importProdukMasterController");

// Multer config untuk file import (xlsx, csv)
const importStorage = multer.memoryStorage();
const importFileFilter = (req, file, cb) => {
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "text/plain",
    "application/csv",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Format file tidak didukung. Gunakan file Excel (.xlsx) atau CSV (.csv)"
      ),
      false
    );
  }
};

const importUpload = multer({
  storage: importStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: importFileFilter,
});

// GET /api/import/produk-master/template
router.get("/template", authenticate, downloadTemplate);

// POST /api/import/produk-master/preview
router.post(
  "/preview",
  authenticate,
  importUpload.single("file"),
  previewImport
);

// POST /api/import/produk-master
router.post("/", authenticate, importUpload.single("file"), importData);

module.exports = router;
