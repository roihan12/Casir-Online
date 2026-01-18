const Joi = require("joi");

const createProdukValidation = Joi.object({
  produkMasterId: Joi.string().required().messages({
    "string.empty": "Product master ID cannot be empty",
    "any.required": "Product master ID is required",
  }),

  cabangId: Joi.string().required().messages({
    "string.empty": "Branch ID cannot be empty",
    "any.required": "Branch ID is required",
  }),

  hargaBeli: Joi.number().required().min(0).messages({
    "number.base": "Purchase price must be a number",
    "number.min": "Purchase price cannot be negative",
    "any.required": "Purchase price is required",
  }),

  hargaJual: Joi.number().required().min(0).messages({
    "number.base": "Selling price must be a number",
    "number.min": "Selling price cannot be negative",
    "any.required": "Selling price is required",
  }),

  hargaGrosir: Joi.number().min(0).allow(null).messages({
    "number.base": "Wholesale price must be a number",
    "number.min": "Wholesale price cannot be negative",
  }),

  stok: Joi.number().integer().default(0).min(0).messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),

  minStok: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Minimum stock must be a number",
    "number.integer": "Minimum stock must be an integer",
    "number.min": "Minimum stock cannot be negative",
  }),

  maxStok: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Maximum stock must be a number",
    "number.integer": "Maximum stock must be an integer",
    "number.min": "Maximum stock cannot be negative",
  }),

  status: Joi.string()
    .valid("tersedia", "kosong", "nonaktif")
    .default("tersedia")
    .messages({
      "string.base": "Status must be a string",
      "any.only": "Status must be one of: tersedia, kosong, nonaktif",
    }),
});

const updateProdukValidation = Joi.object({
  hargaBeli: Joi.number().min(0).messages({
    "number.base": "Purchase price must be a number",
    "number.min": "Purchase price cannot be negative",
  }),

  hargaJual: Joi.number().min(0).messages({
    "number.base": "Selling price must be a number",
    "number.min": "Selling price cannot be negative",
  }),

  hargaGrosir: Joi.number().min(0).allow(null).messages({
    "number.base": "Wholesale price must be a number",
    "number.min": "Wholesale price cannot be negative",
  }),

  minStok: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Minimum stock must be a number",
    "number.integer": "Minimum stock must be an integer",
    "number.min": "Minimum stock cannot be negative",
  }),

  maxStok: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Maximum stock must be a number",
    "number.integer": "Maximum stock must be an integer",
    "number.min": "Maximum stock cannot be negative",
  }),

  status: Joi.string().valid("tersedia", "kosong", "nonaktif").messages({
    "string.base": "Status must be a string",
    "any.only": "Status must be one of: tersedia, kosong, nonaktif",
  }),

  alasanPerubahan: Joi.string().allow("", null).messages({
    "string.base": "Price change reason must be a string",
  }),

  dokumenReferensi: Joi.string().max(100).allow("", null).messages({
    "string.base": "Reference document must be a string",
    "string.max": "Reference document cannot exceed 100 characters",
  }),

  supplierId: Joi.string().allow(null).messages({
    "string.base": "Supplier ID must be a string",
  }),
});

const updateStokValidation = Joi.object({
  quantity: Joi.number().integer().required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "any.required": "Quantity is required",
  }),

  keterangan: Joi.string().required().messages({
    "string.empty": "Description cannot be empty",
    "any.required": "Description is required",
  }),

  referenceId: Joi.string().allow(null).messages({
    "string.base": "Reference ID must be a string",
  }),

  referenceType: Joi.string()
    .valid("MANUAL", "PURCHASE", "SALES", "TRANSFER", "ADJUSTMENT", "RETURN")
    .allow(null)
    .messages({
      "string.base": "Reference type must be a string",
      "any.only": "Reference type must be one of the valid types",
    }),

  batchNumber: Joi.string().max(100).allow(null, "").messages({
    "string.base": "Batch number must be a string",
    "string.max": "Batch number cannot exceed 100 characters",
  }),

  expiredDate: Joi.date().allow(null).messages({
    "date.base": "Expired date must be a valid date",
  }),
});


// Add this to your existing produkValidation.js file

const bulkAddProductsValidation = Joi.object({
  products: Joi.array()
    .items(
      Joi.alternatives().try(
        // Option 1: Just a product master ID string
        Joi.string(),
        // Option 2: Full product configuration object
        Joi.object({
          produkMasterId: Joi.string().required().messages({
            "string.empty": "Product master ID cannot be empty",
            "any.required": "Product master ID is required",
          }),
          hargaBeli: Joi.number().positive().required().messages({
            "number.base": "Purchase price must be a number",
            "number.positive": "Purchase price must be positive",
            "any.required": "Purchase price is required",
          }),
          hargaJual: Joi.number().positive().messages({
            "number.base": "Selling price must be a number",
            "number.positive": "Selling price must be positive",
          }),
          marginPercentage: Joi.number().min(0).max(100).messages({
            "number.base": "Margin percentage must be a number",
            "number.min": "Margin percentage cannot be negative",
            "number.max": "Margin percentage cannot exceed 100",
          }),
          stok: Joi.number().min(0).default(0).messages({
            "number.base": "Stock must be a number",
            "number.min": "Stock cannot be negative",
          }),
          minStok: Joi.number().min(0).default(0).messages({
            "number.base": "Minimum stock must be a number",
            "number.min": "Minimum stock cannot be negative",
          }),
          maxStok: Joi.number().min(0).default(100).messages({
            "number.base": "Maximum stock must be a number",
            "number.min": "Maximum stock cannot be negative",
          }),
          status: Joi.string()
            .valid("tersedia", "kosong", "nonaktif")
            .default("tersedia")
            .messages({
              "string.base": "Status must be a string",
              "any.only": "Status must be one of: tersedia, kosong, nonaktif",
            }),
        })
      )
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      "array.base": "Products must be an array",
      "array.min": "At least one product is required",
      "array.max": "Cannot add more than 100 products at once",
      "any.required": "Products are required",
    }),

  defaultValues: Joi.object({
    hargaBeli: Joi.number().positive().required().messages({
      "number.base": "Purchase price must be a number",
      "number.positive": "Purchase price must be positive",
      "any.required": "Purchase price is required",
    }),

    hargaJual: Joi.number().positive().messages({
      "number.base": "Selling price must be a number",
      "number.positive": "Selling price must be positive",
    }),

    hargaGrosir: Joi.number().positive().allow(null).messages({
      "number.base": "Wholesale price must be a number",
      "number.positive": "Wholesale price must be positive",
    }),

    marginPercentage: Joi.number().min(0).max(100).messages({
      "number.base": "Margin percentage must be a number",
      "number.min": "Margin percentage cannot be negative",
      "number.max": "Margin percentage cannot exceed 100",
    }),

    stok: Joi.number().min(0).default(0).messages({
      "number.base": "Stock must be a number",
      "number.min": "Stock cannot be negative",
    }),

    minStok: Joi.number().min(0).default(0).messages({
      "number.base": "Minimum stock must be a number",
      "number.min": "Minimum stock cannot be negative",
    }),

    maxStok: Joi.number().min(0).default(100).messages({
      "number.base": "Maximum stock must be a number",
      "number.min": "Maximum stock cannot be negative",
    }),

    status: Joi.string()
      .valid("tersedia", "tidak_tersedia")
      .default("tersedia")
      .messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be one of: tersedia, tidak_tersedia",
      }),
  }).optional(),
});


module.exports = {
  createProdukValidation,
  updateProdukValidation,
  updateStokValidation,
  bulkAddProductsValidation
};
