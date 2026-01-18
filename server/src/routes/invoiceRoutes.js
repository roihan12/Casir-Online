const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// GET - List invoices
router.get(
  "/",
  hasPermission(["invoice:read"]),
  invoiceController.getInvoiceList
);

// GET - Get invoice detail
router.get(
  "/:id",
  hasPermission(["invoice:read"]),
  invoiceController.getInvoiceById
);

// POST - Create new invoice from transaction
router.post(
  "/",
  hasPermission(["invoice:create"]),
  invoiceController.createInvoice
);

// PUT - Update invoice
router.put(
  "/:id",
  hasPermission(["invoice:update"]),
  invoiceController.updateInvoice
);

// DELETE - Delete invoice
router.delete(
  "/:id",
  hasPermission(["invoice:delete"]),
  invoiceController.deleteInvoice
);

// POST - Send invoice via email
router.post(
  "/:id/send",
  hasPermission(["invoice:update"]),
  invoiceController.sendInvoice
);

// GET - Generate invoice PDF
router.get(
  "/:id/pdf",
  hasPermission(["invoice:read"]),
  invoiceController.generateInvoicePdf
);

module.exports = router;
