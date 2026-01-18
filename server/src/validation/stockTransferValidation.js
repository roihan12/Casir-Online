const Joi = require("joi");

// Validasi untuk membuat transfer stok baru
const createStockTransferValidation = Joi.object({
  cabangAsalId: Joi.string().required(),
  cabangTujuanId: Joi.string().required(),
  tanggalKirim: Joi.date().allow(null),
  keterangan: Joi.string().allow(null, ""),
  items: Joi.array()
    .items(
      Joi.object({
        produkId: Joi.string().required(),
        jumlahKirim: Joi.number().integer().min(1).required(),
        keterangan: Joi.string().allow(null, ""),
      })
    )
    .min(1)
    .required(),
});

// Validasi untuk update transfer stok
const updateStockTransferValidation = Joi.object({
  cabangAsalId: Joi.string(),
  cabangTujuanId: Joi.string(),
  tanggalKirim: Joi.date().allow(null),
  keterangan: Joi.string().allow(null, ""),
  items: Joi.array().items(
    Joi.object({
      id: Joi.string(), // Transfer detail ID (jika sudah ada)
      produkId: Joi.string().required(),
      jumlahKirim: Joi.number().integer().min(1).required(),
      keterangan: Joi.string().allow(null, ""),
    })
  ),
});

// Validasi untuk submit transfer stok untuk approval
const submitForApprovalValidation = Joi.object({
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk approve transfer stok
const approveStockTransferValidation = Joi.object({
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk reject transfer stok
const rejectStockTransferValidation = Joi.object({
  alasanReject: Joi.string().required(),
});

// Validasi untuk mengirim transfer stok
const sendStockTransferValidation = Joi.object({
  tanggalKirim: Joi.date().required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk menerima transfer stok
const receiveStockTransferValidation = Joi.object({
  tanggalTerima: Joi.date().required(),
  keterangan: Joi.string().allow(null, ""),
  items: Joi.array()
    .items(
      Joi.object({
        transferDetailId: Joi.string().required(),
        jumlahTerima: Joi.number().integer().min(0).required(),
        keterangan: Joi.string().allow(null, ""),
      })
    )
    .min(1)
    .required(),
});

// Validasi untuk membatalkan transfer stok
const cancelStockTransferValidation = Joi.object({
  alasanBatal: Joi.string().required(),
});

// Validasi untuk mendapatkan daftar transfer dengan filter
const getStockTransfersValidation = Joi.object({
  cabangAsalId: Joi.string().optional().empty(""),
  cabangTujuanId: Joi.string().optional().empty(""),
  status: Joi.string().valid(
    "draft",
    "pending_approval",
    "approved",
    "rejected",
    "dikirim",
    "diterima",
    "dibatalkan"
  ).optional().empty(""),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  nomorTransfer: Joi.string().optional().empty(""),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});

module.exports = {
  createStockTransferValidation,
  updateStockTransferValidation,
  submitForApprovalValidation,
  approveStockTransferValidation,
  rejectStockTransferValidation,
  sendStockTransferValidation,
  receiveStockTransferValidation,
  cancelStockTransferValidation,
  getStockTransfersValidation,
};
