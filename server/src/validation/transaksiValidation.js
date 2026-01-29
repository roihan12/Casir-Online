const Joi = require("joi");

// Validasi untuk membuat transaksi baru
const createTransaksiValidation = Joi.object({
  cabang_id: Joi.string().required(),
  jenis_transaksi: Joi.string()
    .valid("PENJUALAN", "PEMBELIAN", "RETUR_PENJUALAN", "RETUR_PEMBELIAN")
    .required(),
  tanggal: Joi.date().default(new Date()),
  pelanggan_id: Joi.string().allow(null, ""),
  supplier_id: Joi.string().allow(null, ""),
  shift_id: Joi.string().allow(null, ""),
  promo_id: Joi.string().allow(null, ""),
  details: Joi.array()
    .items(
      Joi.object({
        produk_id: Joi.string().required(),
        batch_number: Joi.string().allow(null, ""),
        expired_date: Joi.date().allow(null),
        jumlah: Joi.number().integer().min(1).required(),
        harga_satuan: Joi.number().precision(2).min(0).required(),
        diskon_persen: Joi.number().precision(2).min(0).max(100).default(0),
        pajak_persen: Joi.number().precision(2).min(0).max(100).default(0),
      })
    )
    .min(1)
    .required(),
  biaya_tambahan: Joi.number().precision(2).min(0).default(0),
  keterangan: Joi.string().allow(null, ""),
  metode_pembayaran: Joi.string()
    .valid(
      "TUNAI",
      "KARTU_DEBIT",
      "KARTU_KREDIT",
      "TRANSFER",
      "QRIS",
      "E_WALLET",
      "KREDIT_PELANGGAN",
      "TEMPO"
    )
    .required(),
});

// Validasi untuk tambah pembayaran
const createPembayaranValidation = Joi.object({
  transaksi_id: Joi.string().required(),
  metode_pembayaran: Joi.string()
    .valid(
      "TUNAI",
      "KARTU_DEBIT",
      "KARTU_KREDIT",
      "TRANSFER",
      "QRIS",
      "E_WALLET",
      "KREDIT_PELANGGAN"
    )
    .required(),
  status_pembayaran: Joi.string().valid("LUNAS", "BELUM_LUNAS", "DIBATALKAN").required(),
  provider: Joi.string().allow(null, ""),
  nomor_referensi: Joi.string().allow(null, ""),
  jumlah_bayar: Joi.number().precision(2).min(0).required(),
  jumlah_kembali: Joi.number().precision(2).min(0).allow(null),
  tanggal_pembayaran: Joi.date().default(new Date()),
  bukti_bayar_url: Joi.string().allow(null, ""),
  keterangan: Joi.string().allow(null, ""),
  generate_receipt: Joi.boolean().default(true),
});

// Validasi untuk QRIS payment
const qrisPaymentValidation = Joi.object({
  transaksi_id: Joi.string().required(),
  amount: Joi.number().precision(2).min(1).required(),
  description: Joi.string().allow(null, ""),
});

// Validasi untuk update status pembayaran QRIS
const updateQrisStatusValidation = Joi.object({
  payment_id: Joi.string().required(),
  payment_status: Joi.string().valid("SUKSES", "GAGAL", "PENDING").required(),
  reference_id: Joi.string(),
});

// Validasi untuk mendapatkan daftar transaksi
const getTransaksiListValidation = Joi.object({
  cabang_id: Joi.string(),
  jenis_transaksi: Joi.string().valid(
    "PENJUALAN",
    "PEMBELIAN",
    "RETUR_PENJUALAN",
    "RETUR_PEMBELIAN"
  ),
  status_pembayaran: Joi.string().valid("LUNAS", "BELUM_LUNAS", "DIBATALKAN"),
  pelanggan_id: Joi.string(),
  supplier_id: Joi.string(),
  user_id: Joi.string(),
  tanggal_mulai: Joi.date(),
  tanggal_akhir: Joi.date(),
  search: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

// Validasi untuk pengaturan pajak
const taxConfigValidation = Joi.object({
  cabang_id: Joi.string().required(),
  is_tax_enabled: Joi.boolean().required(),
  tax_percentage: Joi.number().precision(2).min(0).max(100).required(),
  tax_name: Joi.string().required(),
  tax_number: Joi.string().allow(null, ""),
  is_tax_included: Joi.boolean().required(),
});

// Validasi untuk memberikan poin loyalitas
const addLoyaltyPointsValidation = Joi.object({
  pelanggan_id: Joi.string().required(),
  transaksi_id: Joi.string().required(),
  poin: Joi.number().integer().min(1).required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk menukarkan poin loyalitas
const redeemLoyaltyPointsValidation = Joi.object({
  pelanggan_id: Joi.string().required(),
  poin: Joi.number().integer().min(1).required(),
  reward_id: Joi.string().required(),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk transaksi kredit
const createKreditTransaksiValidation = Joi.object({
  cabang_id: Joi.string().required(),
  pelanggan_id: Joi.string().required(),
  jatuh_tempo: Joi.date().required(),
  shift_id: Joi.string().allow(null, ""),
  details: Joi.array()
    .items(
      Joi.object({
        produk_id: Joi.string().required(),
        batch_number: Joi.string().allow(null, ""),
        expired_date: Joi.date().allow(null),
        jumlah: Joi.number().integer().min(1).required(),
        harga_satuan: Joi.number().precision(2).min(0).required(),
        diskon_persen: Joi.number().precision(2).min(0).max(100).default(0),
        pajak_persen: Joi.number().precision(2).min(0).max(100).default(0),
      })
    )
    .min(1)
    .required(),
  biaya_tambahan: Joi.number().precision(2).min(0).default(0),
  keterangan: Joi.string().allow(null, ""),
});

// Validasi untuk pembayaran hutang
const createPembayaranHutangValidation = Joi.object({
  hutang_id: Joi.string().required(),
  jumlah_bayar: Joi.number().precision(2).min(0.01).required(),
  metode_pembayaran: Joi.string()
    .valid("TUNAI", "KARTU_DEBIT", "KARTU_KREDIT", "TRANSFER", "QRIS", "E_WALLET")
    .required(),
  nomor_referensi: Joi.string().allow(null, ""),
  keterangan: Joi.string().allow(null, ""),
  bukti_url: Joi.string().allow(null, ""),
});

// Validasi untuk filter daftar hutang
const getHutangListValidation = Joi.object({
  cabang_id: Joi.string(),
  jenis_hutang: Joi.string().valid("pelanggan", "supplier"),
  status_hutang: Joi.string().valid("aktif", "lunas", "cancel"),
  pelanggan_id: Joi.string(),
  supplier_id: Joi.string(),
  tanggal_mulai: Joi.date(),
  tanggal_akhir: Joi.date(),
  jatuh_tempo_mulai: Joi.date(),
  jatuh_tempo_akhir: Joi.date(),
  search: Joi.string(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

module.exports = {
  createTransaksiValidation,
  createPembayaranValidation,
  qrisPaymentValidation,
  updateQrisStatusValidation,
  getTransaksiListValidation,
  taxConfigValidation,
  addLoyaltyPointsValidation,
  redeemLoyaltyPointsValidation,
  createKreditTransaksiValidation,
  createPembayaranHutangValidation,
  getHutangListValidation,
};
