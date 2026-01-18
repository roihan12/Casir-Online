const Joi = require("joi");

const createKreditNotifikasiValidation = Joi.object({
  kreditTransaksiId: Joi.string().required().messages({
    "string.empty": "ID transaksi kredit tidak boleh kosong",
    "any.required": "ID transaksi kredit harus diisi",
  }),
  pelangganId: Joi.string().required().messages({
    "string.empty": "ID pelanggan tidak boleh kosong",
    "any.required": "ID pelanggan harus diisi",
  }),
  angsuranKe: Joi.number().integer().min(1).required().messages({
    "number.base": "Angsuran ke harus berupa angka",
    "number.integer": "Angsuran ke harus berupa bilangan bulat",
    "number.min": "Angsuran ke minimal 1",
    "any.required": "Angsuran ke harus diisi",
  }),
  jumlahTagihan: Joi.number().precision(2).positive().required().messages({
    "number.base": "Jumlah tagihan harus berupa angka",
    "number.positive": "Jumlah tagihan harus lebih dari 0",
    "any.required": "Jumlah tagihan harus diisi",
  }),
  tanggalJatuhTempo: Joi.date().required().messages({
    "date.base": "Tanggal jatuh tempo harus berupa tanggal",
    "any.required": "Tanggal jatuh tempo harus diisi",
  }),
  jenisNotifikasi: Joi.string()
    .valid(
      "PENGINGAT_SEBELUM_JATUH_TEMPO",
      "PENGINGAT_HARI_JATUH_TEMPO",
      "PENGINGAT_SETELAH_JATUH_TEMPO",
      "PEMBAYARAN_TERLAMBAT",
      "PEMBAYARAN_BERHASIL",
      "KREDIT_LUNAS"
    )
    .required()
    .messages({
      "string.empty": "Jenis notifikasi tidak boleh kosong",
      "any.required": "Jenis notifikasi harus diisi",
      "any.only": "Jenis notifikasi tidak valid",
    }),
  metodePengiriman: Joi.array()
    .items(
      Joi.string().valid("EMAIL", "SMS", "WHATSAPP", "APP_NOTIFICATION")
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Metode pengiriman harus berupa array",
      "array.min": "Minimal 1 metode pengiriman harus dipilih",
      "any.required": "Metode pengiriman harus diisi",
      "any.only": "Metode pengiriman tidak valid",
    }),
  pesanNotifikasi: Joi.string().allow("", null).messages({
    "string.base": "Pesan notifikasi harus berupa string",
  }),
});

const reminderOptionsValidation = Joi.object({
  daysBefore: Joi.number().integer().min(1).default(3).messages({
    "number.base": "Hari sebelum jatuh tempo harus berupa angka",
    "number.integer": "Hari sebelum jatuh tempo harus berupa bilangan bulat",
    "number.min": "Hari sebelum jatuh tempo minimal 1",
  }),
  daysAfter: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Hari setelah jatuh tempo harus berupa angka",
    "number.integer": "Hari setelah jatuh tempo harus berupa bilangan bulat",
    "number.min": "Hari setelah jatuh tempo minimal 1",
  }),
  metodePengiriman: Joi.array()
    .items(
      Joi.string().valid("EMAIL", "SMS", "WHATSAPP", "APP_NOTIFICATION")
    )
    .min(1)
    .default(["EMAIL", "APP_NOTIFICATION"])
    .messages({
      "array.base": "Metode pengiriman harus berupa array",
      "array.min": "Minimal 1 metode pengiriman harus dipilih",
      "any.only": "Metode pengiriman tidak valid",
    }),
});

module.exports = {
  createKreditNotifikasiValidation,
  reminderOptionsValidation,
};
