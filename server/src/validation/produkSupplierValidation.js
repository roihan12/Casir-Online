const Joi = require("joi");

/**
 * Schema for creating a new product-supplier relationship
 */
const createProdukSupplierSchema = Joi.object({
  produkMasterId: Joi.string().required().messages({
    "any.required": "ID produk master diperlukan",
    "string.empty": "ID produk master tidak boleh kosong",
  }),

  cabangId: Joi.string().required().messages({
    "any.required": "Cabang diperlukan",
    "string.empty": "Cabang Id tidak boleh kosong",
  }),

  supplierId: Joi.string().required().messages({
    "any.required": "ID supplier diperlukan",
    "string.empty": "ID supplier tidak boleh kosong",
  }),

  isPrimary: Joi.boolean().default(false).messages({
    "boolean.base": "Primary harus berupa nilai boolean",
  }),

  hargaBeli: Joi.number().precision(2).positive().required().messages({
    "any.required": "Harga beli diperlukan",
    "number.base": "Harga beli harus berupa angka",
    "number.positive": "Harga beli harus lebih besar dari 0",
  }),

  minPembelian: Joi.number().integer().min(1).allow(null).messages({
    "number.base": "Minimum pembelian harus berupa angka",
    "number.integer": "Minimum pembelian harus berupa bilangan bulat",
    "number.min": "Minimum pembelian harus minimal 1",
  }),

  leadTime: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Lead time harus berupa angka",
    "number.integer": "Lead time harus berupa bilangan bulat",
    "number.min": "Lead time tidak boleh negatif",
  }),

  kodeProdukSupplier: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Kode produk supplier maksimal 100 karakter",
  }),

  status: Joi.string().valid("aktif", "nonaktif").default("aktif").messages({
    "string.base": "Status harus berupa string",
    "any.only": "Status harus salah satu dari: aktif, tidak_aktif",
  }),
});

/**
 * Schema for updating an existing product-supplier relationship
 */
const updateProdukSupplierSchema = Joi.object({
  isPrimary: Joi.boolean().messages({
    "boolean.base": "Primary harus berupa nilai boolean",
  }),

  hargaBeli: Joi.number().precision(2).positive().messages({
    "number.base": "Harga beli harus berupa angka",
    "number.positive": "Harga beli harus lebih besar dari 0",
  }),

  minPembelian: Joi.number().integer().min(1).allow(null).messages({
    "number.base": "Minimum pembelian harus berupa angka",
    "number.integer": "Minimum pembelian harus berupa bilangan bulat",
    "number.min": "Minimum pembelian harus minimal 1",
  }),

  leadTime: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Lead time harus berupa angka",
    "number.integer": "Lead time harus berupa bilangan bulat",
    "number.min": "Lead time tidak boleh negatif",
  }),

  kodeProdukSupplier: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Kode produk supplier maksimal 100 karakter",
  }),

  status: Joi.string().valid("aktif", "tidak_aktif").messages({
    "string.base": "Status harus berupa string",
    "any.only": "Status harus salah satu dari: aktif, tidak_aktif",
  }),
});

module.exports = {
  createProdukSupplierSchema,
  updateProdukSupplierSchema,
};
