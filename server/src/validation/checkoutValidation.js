const Joi = require("joi");

const checkoutValidation = Joi.object({
  cabang_id: Joi.string().required().messages({
    "any.required": "Cabang ID harus diisi",
  }),

  // Customer info (guest or registered)
  customer_name: Joi.string().max(100).required().messages({
    "any.required": "Nama customer harus diisi",
  }),
  customer_phone: Joi.string()
    .pattern(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .required()
    .messages({
      "any.required": "Nomor telepon harus diisi",
      "string.pattern.base": "Format nomor telepon tidak valid",
    }),
  customer_address: Joi.string().when("order_type", {
    is: "DELIVERY",
    then: Joi.required().messages({
      "any.required": "Alamat pengiriman harus diisi untuk delivery",
    }),
    otherwise: Joi.optional().allow(null, ""),
  }),
  customer_email: Joi.string().email().optional().allow(null, ""),
  pelanggan_id: Joi.string().uuid().optional().allow(null, ""),

  // Order config
  order_type: Joi.string().valid("PICKUP", "DELIVERY").required().messages({
    "any.required": "Tipe order harus diisi",
    "any.only": "Tipe order harus PICKUP atau DELIVERY",
  }),
  payment_method: Joi.string()
    .valid("PAYMENT_LINK", "COD", "PAY_AT_STORE")
    .required()
    .messages({
      "any.required": "Metode pembayaran harus diisi",
      "any.only":
        "Metode pembayaran harus PAYMENT_LINK, COD, atau PAY_AT_STORE",
    }),
  customer_notes: Joi.string().max(500).optional().allow(null, ""),

  // Items
  items: Joi.array()
    .items(
      Joi.object({
        produk_id: Joi.string().uuid().required(),
        jumlah: Joi.number().integer().min(1).required(),
        catatan: Joi.string().max(255).optional().allow(null, ""),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Order harus memiliki minimal 1 item",
      "any.required": "Items harus diisi",
    }),

  // Promo codes (optional)
  promo_codes: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .default([]),
})
  .custom((value, helpers) => {
    // COD only valid for DELIVERY
    if (value.payment_method === "COD" && value.order_type !== "DELIVERY") {
      return helpers.error("any.custom", {
        message: "COD hanya tersedia untuk tipe DELIVERY",
      });
    }
    // PAY_AT_STORE only valid for PICKUP
    if (
      value.payment_method === "PAY_AT_STORE" &&
      value.order_type !== "PICKUP"
    ) {
      return helpers.error("any.custom", {
        message: "Bayar di Toko hanya tersedia untuk tipe PICKUP",
      });
    }
    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });

const getOrderStatusValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
});

const cancelOrderValidation = Joi.object({
  transaksiId: Joi.string().uuid().required(),
  alasan: Joi.string().max(255).optional().allow(null, ""),
});

module.exports = {
  checkoutValidation,
  getOrderStatusValidation,
  cancelOrderValidation,
};
