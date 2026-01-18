const Joi = require("joi");

// Validation schema for creating a product request
const createProdukRequestValidation = Joi.object({
  requestType: Joi.string()
    .valid("new_product", "restock")
    .required()
    .messages({
      "string.empty": "Request type cannot be empty",
      "any.required": "Request type is required",
      "any.only": "Request type must be either 'new_product' or 'restock'",
    }),

  cabangId: Joi.string().required().messages({
    "string.empty": "Branch ID cannot be empty",
    "any.required": "Branch ID is required",
  }),

  prioritas: Joi.string()
    .valid("normal", "urgent", "critical")
    .default("normal")
    .messages({
      "any.only": "Priority must be one of: normal, urgent, critical",
    }),

  alasan: Joi.string().allow("", null).messages({
    "string.base": "Reason must be a string",
  }),

  catatan: Joi.string().allow("", null).messages({
    "string.base": "Notes must be a string",
  }),

  // Validate items array
  items: Joi.array()
    .min(1)
    .items(
      // Create two alternative schemas for new products vs restock
      Joi.alternatives().try(
        // Schema for restock (requires produkMasterId)
        Joi.object({
          produkMasterId: Joi.string().required().messages({
            "string.empty": "Product master ID cannot be empty",
            "any.required":
              "Product master ID is required for restock requests",
          }),

          jumlahDiminta: Joi.number().integer().min(1).required().messages({
            "number.base": "Requested quantity must be a number",
            "number.integer": "Requested quantity must be an integer",
            "number.min": "Requested quantity must be at least 1",
            "any.required": "Requested quantity is required",
          }),

          hargaBeli: Joi.number().min(0).precision(2).messages({
            "number.base": "Purchase price must be a number",
            "number.min": "Purchase price cannot be negative",
            "number.precision":
              "Purchase price must have maximum 2 decimal places",
          }),

          hargaJual: Joi.number().min(0).precision(2).messages({
            "number.base": "Selling price must be a number",
            "number.min": "Selling price cannot be negative",
            "number.precision":
              "Selling price must have maximum 2 decimal places",
          }),

          hargaGrosir: Joi.number().min(0).precision(2).allow(null).messages({
            "number.base": "Wholesale price must be a number",
            "number.min": "Wholesale price cannot be negative",
            "number.precision":
              "Wholesale price must have maximum 2 decimal places",
          }),

          catatan: Joi.string().allow("", null).messages({
            "string.base": "Notes must be a string",
          }),

          // Add these fields as optional in case they're passed for consistency
          namaProduk: Joi.string().allow(null, ""),
          sku: Joi.string().allow(null, ""),
          barcode: Joi.string().allow(null, ""),
          deskripsi: Joi.string().allow(null, ""),
          kategoriId: Joi.string().allow(null, ""),
          brand: Joi.string().allow(null, ""),
          satuan: Joi.string().allow(null, ""),
          berat: Joi.number().allow(null),
          dimensiP: Joi.number().allow(null),
          dimensiL: Joi.number().allow(null),
          dimensiT: Joi.number().allow(null),
          isManagedStock: Joi.boolean().allow(null),
          hasExpired: Joi.boolean().allow(null),
        }),

        // Schema for new product (requires namaProduk and sku)
        Joi.object({
          namaProduk: Joi.string().required().max(100).messages({
            "string.empty": "Product name cannot be empty",
            "any.required": "Product name is required for new product requests",
            "string.max": "Product name cannot exceed 100 characters",
          }),

          sku: Joi.string().required().max(50).messages({
            "string.empty": "SKU cannot be empty",
            "any.required": "SKU is required for new product requests",
            "string.max": "SKU cannot exceed 50 characters",
          }),

          jumlahDiminta: Joi.number().integer().min(1).required().messages({
            "number.base": "Requested quantity must be a number",
            "number.integer": "Requested quantity must be an integer",
            "number.min": "Requested quantity must be at least 1",
            "any.required": "Requested quantity is required",
          }),

          barcode: Joi.string().max(50).allow("", null).messages({
            "string.max": "Barcode cannot exceed 50 characters",
          }),

          deskripsi: Joi.string().allow("", null).messages({
            "string.base": "Description must be a string",
          }),

          kategoriId: Joi.string().allow(null).messages({
            "string.base": "Category ID must be a string",
          }),

          brand: Joi.string().max(100).allow("", null).messages({
            "string.max": "Brand cannot exceed 100 characters",
          }),

          satuan: Joi.string().max(50).allow("", null).messages({
            "string.max": "Unit of measure cannot exceed 50 characters",
          }),

          berat: Joi.number().precision(2).allow(null).messages({
            "number.base": "Weight must be a number",
            "number.precision": "Weight must have maximum 2 decimal places",
          }),

          dimensiP: Joi.number().precision(2).allow(null).messages({
            "number.base": "Length must be a number",
            "number.precision": "Length must have maximum 2 decimal places",
          }),

          dimensiL: Joi.number().precision(2).allow(null).messages({
            "number.base": "Width must be a number",
            "number.precision": "Width must have maximum 2 decimal places",
          }),

          dimensiT: Joi.number().precision(2).allow(null).messages({
            "number.base": "Height must be a number",
            "number.precision": "Height must have maximum 2 decimal places",
          }),

          isManagedStock: Joi.boolean().allow(null).messages({
            "boolean.base": "Managed stock flag must be a boolean",
          }),

          hasExpired: Joi.boolean().allow(null).messages({
            "boolean.base": "Has expiry flag must be a boolean",
          }),

          hargaBeli: Joi.number().min(0).precision(2).messages({
            "number.base": "Purchase price must be a number",
            "number.min": "Purchase price cannot be negative",
            "number.precision":
              "Purchase price must have maximum 2 decimal places",
          }),

          hargaJual: Joi.number().min(0).precision(2).messages({
            "number.base": "Selling price must be a number",
            "number.min": "Selling price cannot be negative",
            "number.precision":
              "Selling price must have maximum 2 decimal places",
          }),

          hargaGrosir: Joi.number().min(0).precision(2).allow(null).messages({
            "number.base": "Wholesale price must be a number",
            "number.min": "Wholesale price cannot be negative",
            "number.precision":
              "Wholesale price must have maximum 2 decimal places",
          }),

          catatan: Joi.string().allow("", null).messages({
            "string.base": "Notes must be a string",
          }),

          // produkMasterId should be null or omitted for new products
          produkMasterId: Joi.string().allow(null, ""),
        })
      )
    )
    .required()
    .messages({
      "array.min": "At least one item must be included in the request",
      "any.required": "Request items are required",
    }),
});

// Validation schema for updating a product request
const updateProdukRequestValidation = Joi.object({
  requestType: Joi.string().valid("new_product", "restock").messages({
    "any.only": "Request type must be either 'new_product' or 'restock'",
  }),

  prioritas: Joi.string().valid("normal", "urgent", "critical").messages({
    "any.only": "Priority must be one of: normal, urgent, critical",
  }),

  alasan: Joi.string().allow("", null).messages({
    "string.base": "Reason must be a string",
  }),

  catatan: Joi.string().allow("", null).messages({
    "string.base": "Notes must be a string",
  }),

  // Same item validation as create but with alternatives
  items: Joi.array()
    .min(1)
    .items(
      // Create two alternative schemas for new products vs restock
      Joi.alternatives().try(
        // Schema for restock (requires produkMasterId)
        Joi.object({
          produkMasterId: Joi.string().required(),
          jumlahDiminta: Joi.number().integer().min(1).required(),
          hargaBeli: Joi.number().min(0).precision(2),
          hargaJual: Joi.number().min(0).precision(2),
          hargaGrosir: Joi.number().min(0).precision(2).allow(null),
          catatan: Joi.string().allow("", null),

          // Add these fields as optional
          namaProduk: Joi.string().allow(null, ""),
          sku: Joi.string().allow(null, ""),
          barcode: Joi.string().allow(null, ""),
          deskripsi: Joi.string().allow(null, ""),
          kategoriId: Joi.string().allow(null, ""),
          brand: Joi.string().allow(null, ""),
          satuan: Joi.string().allow(null, ""),
          berat: Joi.number().allow(null),
          dimensiP: Joi.number().allow(null),
          dimensiL: Joi.number().allow(null),
          dimensiT: Joi.number().allow(null),
          isManagedStock: Joi.boolean().allow(null),
          hasExpired: Joi.boolean().allow(null),
        }),

        // Schema for new product (requires namaProduk and sku)
        Joi.object({
          namaProduk: Joi.string().required().max(100),
          sku: Joi.string().required().max(50),
          jumlahDiminta: Joi.number().integer().min(1).required(),
          barcode: Joi.string().max(50).allow("", null),
          deskripsi: Joi.string().allow("", null),
          kategoriId: Joi.string().allow(null),
          brand: Joi.string().max(100).allow("", null),
          satuan: Joi.string().max(50).allow("", null),
          berat: Joi.number().precision(2).allow(null),
          dimensiP: Joi.number().precision(2).allow(null),
          dimensiL: Joi.number().precision(2).allow(null),
          dimensiT: Joi.number().precision(2).allow(null),
          isManagedStock: Joi.boolean().allow(null),
          hasExpired: Joi.boolean().allow(null),
          hargaBeli: Joi.number().min(0).precision(2),
          hargaJual: Joi.number().min(0).precision(2),
          hargaGrosir: Joi.number().min(0).precision(2).allow(null),
          catatan: Joi.string().allow("", null),

          // produkMasterId should be null or omitted for new products
          produkMasterId: Joi.string().allow(null, ""),
        })
      )
    ),
});

// Validation schema for processing a request (approve/reject)
const processRequestValidation = Joi.object({
  isApproved: Joi.boolean().required().messages({
    "boolean.base": "isApproved must be a boolean",
    "any.required": "isApproved is required",
  }),

  catatan: Joi.string().allow("", null).messages({
    "string.base": "Notes must be a string",
  }),
});

// Validation schema for querying requests
const queryProdukRequestValidation = Joi.object({
  search: Joi.string().allow("", null),
  cabangId: Joi.string().allow("", null),
  requestType: Joi.string().valid("new_product", "restock").allow("", null),
  status: Joi.string()
    .valid("draft", "submitted", "approved", "rejected", "completed")
    .allow("", null),
  prioritas: Joi.string().valid("normal", "urgent", "critical").allow("", null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

module.exports = {
  createProdukRequestValidation,
  updateProdukRequestValidation,
  processRequestValidation,
  queryProdukRequestValidation,
};
