const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.memoryStorage();

// Custom error for file upload
class FileUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileUploadError";
    this.statusCode = 400;
  }
}

// Create file filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new FileUploadError(
        "File type not supported. Please upload images only (JPEG, PNG, GIF, WEBP)."
      ),
      false
    );
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Max 10 files
  },
  fileFilter: fileFilter,
});

// Wrapper to handle multer errors
const handleMulterUpload = (uploadMethod) => {
  return (req, res, next) => {
    uploadMethod(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new FileUploadError(
              "File terlalu besar. Ukuran maksimal adalah 5MB."
            )
          );
        } else if (err.code === "LIMIT_FILE_COUNT") {
          return next(
            new FileUploadError("Terlalu banyak file. Maksimal 10 gambar.")
          );
        } else {
          return next(
            new FileUploadError(`Error mengunggah file: ${err.message}`)
          );
        }
      } else if (err) {
        // Custom or unknown errors
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  upload,
  handleMulterUpload,
};
