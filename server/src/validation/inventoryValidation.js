const Joi = require("joi");

// Validasi untuk penyesuaian stok (adjustment)
const createStockAdjustmentValidation = Joi.object({
  produkId: Joi.string().required(),
  cabangId: Joi.string().required(),
  quantity: Joi.number().required(),
  batchNumber: Joi.string().allow(null, ""),
  expiredDate: Joi.date().allow(null),
  keterangan: Joi.string().allow(null, ""),
  referenceType: Joi.string().valid("adjustment").required(),
});

// Validasi untuk melihat pergerakan stok
const getInventoryMovementsValidation = Joi.object({
  produkId: Joi.string(),
  cabangId: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  referenceType: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

// Validasi untuk update harga produk
const updateProductPriceValidation = Joi.object({
  produkId: Joi.string().required(),
  cabangId: Joi.string().required(),
  tipeHarga: Joi.string().valid("beli", "jual", "grosir").required(),
  hargaBaru: Joi.number().precision(2).required(),
  alasanPerubahan: Joi.string().allow(null, ""),
  supplierId: Joi.string().allow(null, ""),
  dokumenReferensi: Joi.string().allow(null, ""),
});

// Validasi untuk melihat riwayat harga
const getPriceHistoryValidation = Joi.object({
  produkId: Joi.string(),
  cabangId: Joi.string(),
  tipeHarga: Joi.string().valid("beli", "jual", "grosir"),
  startDate: Joi.date(),
  endDate: Joi.date(),
  supplierId: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

// Validasi untuk batch entry stok awal
const batchInitialStockEntryValidation = Joi.object({
  cabangId: Joi.string().required(),
  products: Joi.array()
    .items(
      Joi.object({
        produkId: Joi.string().required(),
        quantity: Joi.number().required(),
        batchNumber: Joi.string().allow(null, ""),
        expiredDate: Joi.date().allow(null),
      })
    )
    .min(1)
    .required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk stock opname
const stockOpnameValidation = Joi.object({
  cabangId: Joi.string().required(),
  tanggalOpname: Joi.date().required(),
  products: Joi.array()
    .items(
      Joi.object({
        produkId: Joi.string().required(),
        stokSistem: Joi.number().required(),
        stokFisik: Joi.number().required(),
        selisih: Joi.number().required(),
        batchNumber: Joi.string().allow(null, ""),
        expiredDate: Joi.date().allow(null),
        keterangan: Joi.string().allow(null, ""),
      })
    )
    .min(1)
    .required(),
  keteranganOpname: Joi.string().allow(null, ""),
});

module.exports = {
  createStockAdjustmentValidation,
  getInventoryMovementsValidation,
  updateProductPriceValidation,
  getPriceHistoryValidation,
  batchInitialStockEntryValidation,
  stockOpnameValidation,
};
