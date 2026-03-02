const prisma = require("../config/db");
const { basePrisma } = require("../config/db");
const { ResponseError } = require("../error/responseError");
const midtransService = require("./midtransService");
const promoService = require("./promoService");
const taxService = require("./taxService");
const { haversineDistance, calculateDeliveryFee } = require("../utils/haversine");
const orderNotification = require("./orderNotificationService");

/**
 * Helper: Run checkout operations with RLS context
 * Since checkout is public (no auth), we must SET LOCAL manually
 */
const withCheckoutRls = async (cabangId, callback) => {
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_cabang_ids = '${cabangId.replace(/'/g, "''")}'`
    );
    return callback(tx);
  }, { timeout: 30000 });
};

/**
 * Checkout Service — Public, no auth required
 * Handles online order creation with 3 payment methods:
 * - PAYMENT_LINK: Midtrans Snap (redirect to payment page)
 * - COD: Cash on Delivery (order confirmed immediately)
 * - PAY_AT_STORE: Customer pays when picking up
 */

/**
 * Generate transaction number for online orders
 */
const generateOnlineTransaksiNumber = async (cabangId, tx = null) => {
  const client = tx || basePrisma;
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await client.transaksi.count({
    where: {
      cabang_id: cabangId,
      order_source: "ECATALOG",
      created_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `OL-${cabangId}-${dateStr}-${sequence}`;
};

/**
 * Create an online order
 */
const createOnlineOrder = async (data) => {
  const {
    cabang_id,
    customer_name,
    customer_phone,
    customer_address,
    customer_email,
    pelanggan_id,
    order_type,
    payment_method,
    customer_notes,
    items,
    promo_codes = [],
    customer_lat,
    customer_lng,
  } = data;

  // 1. Verify branch exists
  const cabang = await prisma.cabang.findFirst({
    where: { id: cabang_id, status: "aktif" },
  });
  if (!cabang) {
    throw new ResponseError(404, "Toko tidak ditemukan");
  }

  // 2. Verify products and check stock (use withCheckoutRls for RLS)
  const produkIds = items.map((item) => item.produk_id);
  const products = await withCheckoutRls(cabang_id, async (tx) => {
    return tx.produk.findMany({
      where: {
        id: { in: produkIds },
        cabangId: cabang_id,
        status: "tersedia",
        deletedAt: null,
      },
      include: {
        produkMaster: {
          select: {
            namaProduk: true,
            sku: true,
          },
        },
      },
    });
  });

  if (products.length !== produkIds.length) {
    const foundIds = products.map((p) => p.id);
    const missingIds = produkIds.filter((id) => !foundIds.includes(id));
    throw new ResponseError(
      400,
      `Beberapa produk tidak ditemukan atau tidak tersedia: ${missingIds.join(", ")}`
    );
  }

  // Check stock availability
  for (const item of items) {
    const product = products.find((p) => p.id === item.produk_id);
    if (product.stok !== null && product.stok < item.jumlah) {
      throw new ResponseError(
        400,
        `Stok ${product.produkMaster.namaProduk} tidak cukup (tersedia: ${product.stok}, diminta: ${item.jumlah})`
      );
    }
  }

  // 3. Try to match pelanggan by phone if pelanggan_id not provided
  let matchedPelangganId = pelanggan_id || null;
  if (!matchedPelangganId && customer_phone) {
    const pelanggan = await prisma.pelanggan.findFirst({
      where: {
        telepon: customer_phone,
        status: "aktif",
        deletedAt: null,
      },
    });
    if (pelanggan) {
      matchedPelangganId = pelanggan.id;
    }
  }

  // 4. Validate promo codes (if any)
  let promoDiscount = 0;
  let validatedPromos = [];
  if (promo_codes.length > 0) {
    try {
      // Calculate cart total for promo validation
      const cartTotal = items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.produk_id);
        return sum + Number(product.hargaJual) * item.jumlah;
      }, 0);

      const cartItems = items.map((item) => {
        const product = products.find((p) => p.id === item.produk_id);
        return {
          produkId: item.produk_id,
          produkMasterId: product.produkMasterId,
          quantity: item.jumlah,
          harga: Number(product.hargaJual),
          total: Number(product.hargaJual) * item.jumlah,
        };
      });

      for (const code of promo_codes) {
        try {
          const result = await promoService.verifyPromoCode({
            kodePromo: code,
            cabangId: cabang_id,
            subtotal: cartTotal,
            pelangganId: matchedPelangganId,
            items: cartItems,
          });
          if (result && result.valid) {
            promoDiscount += Number(result.discount || 0);
            validatedPromos.push({
              promo_id: result.promo?.id,
              kode_promo: code,
              nilai_diskon: Number(result.discount || 0),
            });
          }
        } catch (promoErr) {
          // Skip invalid promo codes but don't block checkout
          console.warn(`Promo code ${code} invalid:`, promoErr.message);
        }
      }
    } catch (err) {
      console.error("Error validating promo codes:", err);
    }
  }

  // 5. Calculate totals
  let subtotal = 0;
  const detailData = items.map((item) => {
    const product = products.find((p) => p.id === item.produk_id);
    const hargaSatuan = Number(product.hargaJual);
    const itemSubtotal = hargaSatuan * item.jumlah;
    subtotal += itemSubtotal;
    return {
      produk_id: item.produk_id,
      jumlah: item.jumlah,
      harga_satuan: hargaSatuan,
      diskon_persen: 0,
      diskon_nominal: 0,
      subtotal: itemSubtotal,
      pajak_persen: 0,
      total: itemSubtotal,
      catatan: item.catatan || null,
    };
  });

  // Calculate delivery fee (GPS-based)
  let deliveryFee = 0;
  let deliveryDistanceKm = 0;
  if (order_type === "DELIVERY" && customer_lat && customer_lng && cabang.latitude && cabang.longitude) {
    deliveryDistanceKm = haversineDistance(
      Number(cabang.latitude), Number(cabang.longitude),
      Number(customer_lat), Number(customer_lng)
    );
    const deliveryResult = calculateDeliveryFee(deliveryDistanceKm);
    if (!deliveryResult.isDeliverable) {
      throw new ResponseError(400, `Jarak pengiriman terlalu jauh (${deliveryDistanceKm} km). Maksimal ${deliveryResult.maxRadius} km.`);
    }
    deliveryFee = deliveryResult.fee;
  } else if (order_type === "DELIVERY") {
    // Fallback: flat rate if no GPS
    deliveryFee = 3000;
  }

  // Calculate tax from branch config
  const diskon = promoDiscount;
  const subtotalAfterDiskon = subtotal - diskon;
  let pajak = 0;
  try {
    pajak = await taxService.calculateTax(subtotalAfterDiskon, cabang_id);
  } catch (taxErr) {
    console.warn("Tax calculation failed, using 0:", taxErr.message);
  }

  // Biaya tambahan (flat packaging fee)
  const biayaTambahan = 1000;

  const total = subtotalAfterDiskon + pajak + deliveryFee + biayaTambahan;

  // 6. Determine order status based on payment method
  const isImmediateConfirm =
    payment_method === "COD" || payment_method === "PAY_AT_STORE";
  const orderStatus = isImmediateConfirm ? "CONFIRMED" : "PENDING";
  const statusPembayaran = "BELUM_LUNAS";

  // 7. Create order in transaction (with RLS context)
  const result = await withCheckoutRls(cabang_id, async (tx) => {
    // Generate transaction number
    const nomorTransaksi = await generateOnlineTransaksiNumber(cabang_id, tx);

    // Create transaksi
    const transaksi = await tx.transaksi.create({
      data: {
        cabang_id,
        nomor_transaksi: nomorTransaksi,
        tanggal: new Date(),
        pelanggan_id: matchedPelangganId,
        jenis_transaksi: "PENJUALAN",
        order_source: "ECATALOG",
        order_type,
        order_status: orderStatus,
        status_pembayaran: statusPembayaran,
        subtotal,
        diskon,
        pajak,
        biaya_tambahan: biayaTambahan,
        delivery_fee: deliveryFee,
        total,
        customer_address: customer_address || null,
        customer_notes: customer_notes || null,
        customer_email: customer_email || null,
        keterangan: `Online order - ${payment_method}`,
        order_expired_at:
          payment_method === "PAYMENT_LINK"
            ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
            : null,
        confirmed_at: isImmediateConfirm ? new Date() : null,
        total_diskon_final: diskon,
      },
    });

    // Create transaksi_detail
    for (const detail of detailData) {
      await tx.transaksiDetail.create({
        data: {
          transaksi_id: transaksi.transaksi_id,
          produk_id: detail.produk_id,
          jumlah: detail.jumlah,
          harga_satuan: detail.harga_satuan,
          diskon_persen: detail.diskon_persen,
          diskon_nominal: detail.diskon_nominal,
          subtotal: detail.subtotal,
          pajak_persen: detail.pajak_persen,
          total: detail.total,
        },
      });
    }

    // Create transaksi_promo records
    for (const promo of validatedPromos) {
      await tx.transaksiPromo.create({
        data: {
          transaksi: { connect: { transaksi_id: transaksi.transaksi_id } },
          promo: { connect: { id: promo.promo_id } },
          totalDiskon: promo.nilai_diskon,
          isApplied: true,
        },
      });
    }

    // For COD and PAY_AT_STORE: reduce stock immediately
    if (isImmediateConfirm) {
      for (const item of items) {
        const product = products.find((p) => p.id === item.produk_id);
        if (product.stok !== null) {
          await tx.produk.update({
            where: { id: item.produk_id },
            data: { stok: { decrement: item.jumlah } },
          });

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              produkId: item.produk_id,
              referenceId: transaksi.transaksi_id,
              referenceType: "PENJUALAN_ONLINE",
              quantity: -item.jumlah,
              keterangan: `Penjualan online ${nomorTransaksi}`,
              userId: "system",
              cabangId: cabang_id,
            },
          });
        }
      }
    }

    // Create pembayaran record
    let paymentResult = null;
    const paymentData = {
      transaksi_id: transaksi.transaksi_id,
      jumlah_bayar: total,
      jumlah_kembali: 0,
      tanggal_pembayaran: new Date(),
      status: "PENDING",
      metode_pembayaran:
        payment_method === "PAYMENT_LINK"
          ? "ONLINE"
          : payment_method === "COD"
            ? "TUNAI"
            : "TUNAI",
      payment_channel:
        payment_method === "PAYMENT_LINK" ? "MIDTRANS" : "MANUAL",
    };

    // For PAYMENT_LINK: generate Midtrans payment link
    if (payment_method === "PAYMENT_LINK") {
      const orderItems = detailData.map((d) => {
        const product = products.find((p) => p.id === d.produk_id);
        return {
          id: d.produk_id,
          price: Math.round(d.harga_satuan),
          quantity: d.jumlah,
          name: product.produkMaster.namaProduk.substring(0, 50),
        };
      });

      paymentResult = await midtransService.generatePaymentLink({
        transaction_id: transaksi.transaksi_id,
        gross_amount: total,
        customer_name,
        customer_email,
        customer_phone,
        order_items: orderItems,
        expiry_duration: 30,
      });

      paymentData.payment_reference = transaksi.transaksi_id;
      paymentData.payment_external_id = paymentResult.token;
      paymentData.redirect_url = paymentResult.redirect_url;
      paymentData.expired_at = new Date(Date.now() + 30 * 60 * 1000);
    }

    const pembayaran = await tx.pembayaran.create({
      data: paymentData,
    });

    return {
      transaksi,
      pembayaran,
      paymentResult,
    };
  });

  // 8. Build response
  const response = {
    transaksi_id: result.transaksi.transaksi_id,
    nomor_transaksi: result.transaksi.nomor_transaksi,
    order_status: result.transaksi.order_status,
    order_type,
    payment_method,
    total: Number(result.transaksi.total),
    subtotal: Number(result.transaksi.subtotal),
    diskon: Number(result.transaksi.diskon),
    delivery_fee: Number(result.transaksi.delivery_fee || 0),
    items: detailData.map((d) => {
      const product = products.find((p) => p.id === d.produk_id);
      return {
        produk_id: d.produk_id,
        nama_produk: product.produkMaster.namaProduk,
        jumlah: d.jumlah,
        harga: d.harga_satuan,
        total: d.total,
      };
    }),
    promos_applied: validatedPromos,
    customer: {
      name: customer_name,
      phone: customer_phone,
      address: customer_address,
      email: customer_email,
      pelanggan_id: matchedPelangganId,
    },
  };

  // Add payment URL for PAYMENT_LINK
  if (payment_method === "PAYMENT_LINK" && result.paymentResult) {
    response.payment_url = result.paymentResult.redirect_url;
    response.payment_token = result.paymentResult.token;
    response.payment_expired_at = new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString();
  }

  // 9. Send WhatsApp notifications (non-blocking)
  const notifData = { ...response, cabang_id };
  orderNotification.sendOrderConfirmation(notifData, cabang).catch(() => {});
  orderNotification.sendOrderNotificationToAdmin(notifData, cabang).catch(() => {});

  return response;
};

/**
 * Get order status (public — customer can check their order)
 */
const getOrderStatus = async (transaksiId, cabangId) => {
  // cabangId from query param for RLS context
  if (!cabangId) {
    throw new ResponseError(400, "cabangId is required");
  }

  const transaksi = await withCheckoutRls(cabangId, async (tx) => {
    return tx.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
    },
    include: {
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: {
                select: {
                  namaProduk: true,
                  sku: true,
                  produkImage: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { filePath: true },
                  },
                },
              },
            },
          },
        },
      },
      pembayaran: {
        select: {
          pembayaran_id: true,
          metode_pembayaran: true,
          payment_channel: true,
          status: true,
          jumlah_bayar: true,
          paid_at: true,
          redirect_url: true,
        },
      },
      delivery_tracking: {
        orderBy: { created_at: "desc" },
        select: {
          tracking_id: true,
          status: true,
          notes: true,
          created_at: true,
          address: true,
        },
      },
      driver: {
        select: {
          driver_id: true,
          nama: true,
          no_hp: true,
          jenis_kendaraan: true,
          plat_kendaraan: true,
        },
      },
      cabang: {
        select: {
          id: true,
          namaCabang: true,
          alamat: true,
          telepon: true,
        },
      },
    },
    });
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order tidak ditemukan");
  }

  return {
    transaksi_id: transaksi.transaksi_id,
    nomor_transaksi: transaksi.nomor_transaksi,
    order_status: transaksi.order_status,
    order_type: transaksi.order_type,
    payment_status: transaksi.status_pembayaran,
    delivery_status: transaksi.delivery_status,
    created_at: transaksi.created_at,
    confirmed_at: transaksi.confirmed_at,
    order_expired_at: transaksi.order_expired_at,
    total: Number(transaksi.total),
    subtotal: Number(transaksi.subtotal),
    diskon: Number(transaksi.diskon),
    delivery_fee: Number(transaksi.delivery_fee || 0),
    customer: {
      address: transaksi.customer_address,
      notes: transaksi.customer_notes,
      email: transaksi.customer_email,
    },
    items: transaksi.transaksi_detail.map((d) => ({
      nama_produk: d.produk?.produkMaster?.namaProduk || "Unknown",
      sku: d.produk?.produkMaster?.sku,
      image:
        d.produk?.produkMaster?.produkImage?.[0]?.filePath || null,
      jumlah: d.jumlah,
      harga: Number(d.harga_satuan),
      total: Number(d.total),
    })),
    pembayaran: transaksi.pembayaran.map((p) => ({
      id: p.pembayaran_id,
      metode: p.metode_pembayaran,
      channel: p.payment_channel,
      status: p.status,
      jumlah: Number(p.jumlah_bayar),
      paid_at: p.paid_at,
      payment_url: p.redirect_url,
    })),
    driver: transaksi.driver
      ? {
          nama: transaksi.driver.nama,
          phone: transaksi.driver.no_hp,
          kendaraan: transaksi.driver.jenis_kendaraan,
          plat: transaksi.driver.plat_kendaraan,
        }
      : null,
    tracking: transaksi.delivery_tracking.map((t) => ({
      status: t.status,
      notes: t.notes,
      created_at: t.created_at,
    })),
    cabang: transaksi.cabang
      ? {
          nama: transaksi.cabang.namaCabang,
          alamat: transaksi.cabang.alamat,
          telepon: transaksi.cabang.telepon,
        }
      : null,
  };
};

/**
 * Cancel order by customer (only if PENDING)
 */
const cancelOrder = async (transaksiId, alasan, cabangId) => {
  if (!cabangId) {
    throw new ResponseError(400, "cabangId is required");
  }

  // Verify the order exists and check status using withCheckoutRls
  const transaksi = await withCheckoutRls(cabangId, async (tx) => {
    return tx.transaksi.findFirst({
      where: {
        transaksi_id: transaksiId,
        order_source: "ECATALOG",
      },
    });
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order tidak ditemukan");
  }

  if (transaksi.order_status !== "PENDING") {
    throw new ResponseError(
      400,
      "Order tidak dapat dibatalkan (status: " + transaksi.order_status + ")"
    );
  }

  await withCheckoutRls(cabangId, async (tx) => {
    // Update order status
    await tx.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: {
        order_status: "CANCELLED",
        status_pembayaran: "DIBATALKAN",
        order_cancelled_reason: alasan || "Dibatalkan oleh customer",
      },
    });

    // Update payment status
    await tx.pembayaran.updateMany({
      where: {
        transaksi_id: transaksiId,
        status: "PENDING",
      },
      data: { status: "GAGAL" },
    });

    // Create cancellation record
    await tx.order_cancellation.create({
      data: {
        transaksi_id: transaksiId,
        cancellation_reason: alasan || "Dibatalkan oleh customer",
        cancelled_at: new Date(),
      },
    });

    // Try to cancel on Midtrans if payment was PAYMENT_LINK
    const pendingPayment = await tx.pembayaran.findFirst({
      where: {
        transaksi_id: transaksiId,
        payment_channel: "MIDTRANS",
      },
    });

    if (pendingPayment && pendingPayment.payment_reference) {
      try {
        await midtransService.cancelTransaction(
          pendingPayment.payment_reference
        );
      } catch (err) {
        console.warn("Failed to cancel on Midtrans:", err.message);
      }
    }
  });

  // Send cancellation WA notification (non-blocking)
  orderNotification.sendOrderStatusUpdate(transaksiId, "CANCELLED").catch(() => {});

  return { success: true, message: "Order berhasil dibatalkan" };
};

module.exports = {
  createOnlineOrder,
  getOrderStatus,
  cancelOrder,
};
