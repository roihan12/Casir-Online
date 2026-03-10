const express = require("express");
const produkRequestController = require("../controllers/produkRequestController");
const {
 authenticate
} = require("../middleware/authMiddleware");
const {upload} = require("../middleware/uploadMiddleware");
const {hasPermission} = require("../middleware/permissionMiddleware");
const { uploadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get request analytics (for dashboard)
router.get("/analytics", hasPermission(["produk:read"]), produkRequestController.getProdukRequestAnalytics);

// List and filter all product requests
router.get("/", hasPermission(["produk:read"]), produkRequestController.getAllProdukRequests);

// Get a product request by ID
router.get("/:id", hasPermission(["produk:read"]), produkRequestController.getProdukRequestById);

// Create a new product request
router.post(
  "/",
  hasPermission(["produk:create"]),
  uploadLimiter,
  upload.array("attachments", 5), // Max 5 attachments
  produkRequestController.createProdukRequest
);

// Submit a draft product request
router.post("/:id/submit", hasPermission(["produk:update"]), produkRequestController.submitProdukRequest);

// Process a request (approve/reject)
router.post(
  "/:id/process",
  hasPermission(["produk:manage"]),
  produkRequestController.processRequest
);

// Mark a product request as completed
router.post("/:id/complete", hasPermission(["produk:update"]), produkRequestController.completeProdukRequest);

// Update an existing product request
router.put(
  "/:id",
  hasPermission(["produk:update"]),
  uploadLimiter,
  upload.array("attachments", 5), // Max 5 attachments
  produkRequestController.updateProdukRequest
);

// Delete a product request (soft delete)
router.delete("/:id", hasPermission(["produk:delete"]), produkRequestController.deleteProdukRequest);

// Delete an attachment
router.delete(
  "/attachments/:attachmentId",
  hasPermission(["produk:update"]),
  produkRequestController.deleteRequestAttachment
);

module.exports = router;
