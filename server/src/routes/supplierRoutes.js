const express = require("express");
const supplierController = require("../controllers/supplierController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get supplier dashboard statistics
router.get("/dashboard", hasPermission(["supplier:read"]), supplierController.getSupplierDashboard);

router.post("/", hasPermission(["supplier:create"]), supplierController.createSupplier);

router.put("/:id", hasPermission(["supplier:update"]), supplierController.updateSupplier);

router.delete("/:id", hasPermission(["supplier:delete"]), supplierController.deleteSupplier);

router.get("/", hasPermission(["supplier:read"]), supplierController.getAllSuppliers);

router.get("/cabang/:cabangId", hasPermission(["supplier:read"], { checkBranch: true }), supplierController.getSupplierByCabang);

router.get("/:id", hasPermission(["supplier:read"]), supplierController.getSupplierById);

router.get("/:id/detail", hasPermission(["supplier:read"]), supplierController.getSupplierDetail);

module.exports = router;
