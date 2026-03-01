const Joi = require("joi");

// TipeDiskon enum values
const tipeDiskonValues = ["PERSENTASE", "NOMINAL", "BUY_X_GET_Y", "HARGA_SPESIAL", "CASHBACK", "VOUCHER"];

// TipeScopePromo enum values
const tipeScopeValues = ["GLOBAL", "CABANG_SPESIFIK", "PRODUK_SPESIFIK", "KATEGORI_SPESIFIK", "CUSTOM"];

// PromoDiskonStatus enum values
const statusValues = ["aktif", "tidak_aktif", "kadaluarsa"];

// Schema for Buy X Get Y configuration
const buyXgetYConfigSchema = Joi.object({
  buyQty: Joi.number().integer().min(1).required(),
  getQty: Joi.number().integer().min(1).required(),
  buyProductId: Joi.string().uuid().allow(null),
  getProductId: Joi.string().uuid().allow(null),
  maxFreeItems: Joi.number().integer().min(0).allow(null),
});

// Create promo schema
const createPromoSchema = Joi.object({
  namaPromo: Joi.string().max(100).required(),
  kodePromo: Joi.string().max(50).required(),
  deskripsi: Joi.string().allow(null, "").empty("").default(null),
  tipeDiskon: Joi.string().valid(...tipeDiskonValues).required(),
  nilaiDiskon: Joi.number().precision(2).min(0).required(),
  buyXgetYConfig: Joi.object().when("tipeDiskon", {
    is: "BUY_X_GET_Y",
    then: buyXgetYConfigSchema.required(),
    otherwise: buyXgetYConfigSchema.allow(null),
  }),
  minPembelian: Joi.number().precision(2).min(0).allow(null).default(null),
  maxDiskon: Joi.number().precision(2).min(0).allow(null).default(null),
  maxPenggunaanTotal: Joi.number().integer().min(0).allow(null).default(null),
  maxPenggunaanPerUser: Joi.number().integer().min(0).allow(null).default(null),
  tanggalMulai: Joi.date().allow(null).default(null),
  tanggalBerakhir: Joi.date().allow(null).default(null),
  limitPenggunaan: Joi.number().integer().min(0).allow(null).default(null),
  tipeScope: Joi.string().valid(...tipeScopeValues).default("GLOBAL"),
  kategoriId: Joi.string().uuid().allow(null).default(null),
  produkId: Joi.string().uuid().allow(null).default(null),
  cabangId: Joi.string().uuid().allow(null).default(null),
  status: Joi.string().valid(...statusValues).default("aktif"),
});

// Update promo schema (all fields optional)
const updatePromoSchema = Joi.object({
  namaPromo: Joi.string().max(100).optional(),
  kodePromo: Joi.string().max(50).optional(),
  deskripsi: Joi.string().allow(null, "").empty("").default(null).optional(),
  tipeDiskon: Joi.string().valid(...tipeDiskonValues).optional(),
  nilaiDiskon: Joi.number().precision(2).min(0).optional(),
  buyXgetYConfig: buyXgetYConfigSchema.allow(null).optional(),
  minPembelian: Joi.number().precision(2).min(0).allow(null).optional(),
  maxDiskon: Joi.number().precision(2).min(0).allow(null).optional(),
  maxPenggunaanTotal: Joi.number().integer().min(0).allow(null).optional(),
  maxPenggunaanPerUser: Joi.number().integer().min(0).allow(null).optional(),
  tanggalMulai: Joi.date().allow(null).optional(),
  tanggalBerakhir: Joi.date().allow(null).optional(),
  limitPenggunaan: Joi.number().integer().min(0).allow(null).optional(),
  tipeScope: Joi.string().valid(...tipeScopeValues).optional(),
  kategoriId: Joi.string().uuid().allow(null).optional(),
  produkId: Joi.string().uuid().allow(null).optional(),
  cabangId: Joi.string().uuid().allow(null).optional(),
  status: Joi.string().valid(...statusValues).optional(),
}).min(1);

// Verify promo code schema
const verifyPromoSchema = Joi.object({
  kodePromo: Joi.string().max(50).required(),
  subtotal: Joi.number().precision(2).min(0).required(),
  cabangId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      produkId: Joi.string().uuid().required(),
      produkMasterId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      harga: Joi.number().precision(2).min(0).required(),
      total: Joi.number().precision(2).min(0).required(),
    })
  ).default([]),
  pelangganId: Joi.string().uuid().allow(null).default(null),
  metodePembayaran: Joi.string().allow(null).default(null),
});

// Verify multiple promos schema
const verifyMultiplePromosSchema = Joi.object({
  promoCodes: Joi.array().items(Joi.string().max(50)).min(1).required(),
  cabangId: Joi.string().required(),
  subtotal: Joi.number().precision(2).min(0).required(),
  items: Joi.array().items(
    Joi.object({
      produkId: Joi.string().uuid().required(),
      produkMasterId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      harga: Joi.number().precision(2).min(0).required(),
      total: Joi.number().precision(2).min(0).required(),
    })
  ).default([]),
  pelangganId: Joi.string().uuid().allow(null).default(null),
  metodePembayaran: Joi.string().allow(null).default(null),
});

// Calculate preview schema
const calculatePreviewSchema = Joi.object({
  promoCodes: Joi.array().items(Joi.string().max(50)).min(1).required(),
  cabangId: Joi.string().required(),
  subtotal: Joi.number().precision(2).min(0).required(),
  items: Joi.array().items(
    Joi.object({
      produkId: Joi.string().uuid().required(),
      produkMasterId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      harga: Joi.number().precision(2).min(0).required(),
      total: Joi.number().precision(2).min(0).required(),
    })
  ).default([]),
  pelangganId: Joi.string().uuid().allow(null).default(null),
  metodePembayaran: Joi.string().allow(null).default(null),
});

// Change promo status schema
const changePromoStatusSchema = Joi.object({
  status: Joi.string().valid(...statusValues).required(),
});

module.exports = {
  createPromoSchema,
  updatePromoSchema,
  verifyPromoSchema,
  verifyMultiplePromosSchema,
  calculatePreviewSchema,
  changePromoStatusSchema,
};
