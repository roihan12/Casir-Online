const express = require("express");
const router = express.Router();
const cabangController = require("../controllers/cabangController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { cabangAccess } = require("../middleware/cabangMiddleware");

// Get all cabang that user has access to
router.get("/", authenticate, cabangController.getAllCabang);

// Get specific cabang
router.get(
  "/:cabangId",
  authenticate,
  cabangAccess,
  cabangController.getCabangById
);

// Get cabang by user id
router.get(
  "/user/:userId",
  authenticate,
  cabangController.getCabangByUserId
);

// Super admin operations (now dynamic)
router.post(
  "/",
  authenticate,
  hasPermission(["cabang:create"]),
  cabangController.createCabang
);
router.put(
  "/:cabangId",
  authenticate,
  hasPermission(["cabang:update"]),
  cabangController.updateCabang
);
router.delete(
  "/:cabangId",
  authenticate,
  hasPermission(["cabang:delete"]),
  cabangController.deleteCabang
);

module.exports = router;
