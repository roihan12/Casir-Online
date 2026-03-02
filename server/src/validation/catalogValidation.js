const Joi = require("joi");

const getCatalogProductsValidation = Joi.object({
  cabangId: Joi.string().required(),
  search: Joi.string().max(100).optional().allow(""),
  kategoriId: Joi.string().uuid().optional().allow(""),
  sortBy: Joi.string()
    .valid("nama", "harga_asc", "harga_desc", "terbaru")
    .optional()
    .default("terbaru"),
  page: Joi.number().integer().min(1).max(1000).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(12),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
});

const getCatalogCategoriesValidation = Joi.object({
  cabangId: Joi.string().required(),
});

const getProductDetailValidation = Joi.object({
  produkId: Joi.string().uuid().required(),
});

const getCabangInfoValidation = Joi.object({
  cabangId: Joi.string().required(),
});

const verifyPromoValidation = Joi.object({
  cabangId: Joi.string().required(),
  kodePromo: Joi.string().required().max(50),
  subtotal: Joi.number().min(0).required(),
  pelangganId: Joi.string().uuid().optional().allow(null, ""),
  items: Joi.array()
    .items(
      Joi.object({
        produkId: Joi.string().uuid().required(),
        produkMasterId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        harga: Joi.number().min(0).optional(),
        total: Joi.number().min(0).required(),
      })
    )
    .optional(),
});

const getEligiblePromosValidation = Joi.object({
  cabangId: Joi.string().required(),
  subtotal: Joi.number().min(0).optional().default(0),
  pelangganId: Joi.string().uuid().optional().allow(null, ""),
  items: Joi.array()
    .items(
      Joi.object({
        produkId: Joi.string().uuid().required(),
        produkMasterId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        harga: Joi.number().min(0).optional(),
        total: Joi.number().min(0).required(),
      })
    )
    .optional(),
});

const trackOrderValidation = Joi.object({
  cabangId: Joi.string().required(),
  identifier: Joi.string().required().min(3), // phone number or order number
});

module.exports = {
  getCatalogProductsValidation,
  getCatalogCategoriesValidation,
  getProductDetailValidation,
  getCabangInfoValidation,
  verifyPromoValidation,
  getEligiblePromosValidation,
  trackOrderValidation,
};
