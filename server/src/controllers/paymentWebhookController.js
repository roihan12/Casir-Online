const prisma = require("../config/db");
const midtransService = require("../services/midtransService");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const orderNotification = require("../services/orderNotificationService");

/**
 * Handle Midtrans webhook notification
 * POST /api/payment/webhook/midtrans
 */
const handleMidtransWebhook = async (req, res, next) => {
  try {
    const notification = req.body;

    // 1. Log the webhook request
    await prisma.payment_webhook_log.create({
      data: {
        payment_reference: notification.order_id || "unknown",
        webhook_source: "MIDTRANS",
        event_type: notification.transaction_status,
        request_method: req.method,
        request_url: req.originalUrl,
        request_headers: req.headers,
        request_body: notification,
        request_ip: req.ip,
      },
    });

    // 2. Process the notification via Midtrans service
    const result = await midtransService.handleNotification(notification);

    console.log("result", result);

    if (!result || !result.order_id) {
      return res.status(200).json({ status: "ok" });
    }

    // 3. Find the transaction
    const transaksi = await prisma.transaksi.findFirst({
      where: {
        transaksi_id: result.order_id,
      },
      include: {
        transaksi_detail: true,
      },
    });

    console.log("transaksi TAYOO", transaksi);

    if (!transaksi) {
      logger.warn("Webhook received for unknown transaction", {
        order_id: result.order_id,
      });
      return res.status(200).json({ status: "ok" });
    }

    // 4. Check idempotency — skip if already processed
    if (
      transaksi.order_status === "COMPLETED" ||
      transaksi.order_status === "CANCELLED"
    ) {
      return res.status(200).json({ status: "ok", message: "Already processed" });
    }

    // 5. Process based on payment status
    if (result.status === "SUKSES") {
      await handlePaymentSuccess(transaksi, result);
    } else if (result.status === "GAGAL") {
      await handlePaymentFailed(transaksi, result);
    }
    // PENDING status — no action needed

    // 6. Update webhook log as processed
    await prisma.payment_webhook_log.updateMany({
      where: {
        payment_reference: result.order_id,
        processed: false,
      },
      data: {
        processed: true,
        processed_at: new Date(),
        response_status: 200,
      },
    });

    // Always return 200 to Midtrans
    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Webhook processing error", {
      error: error.message,
      stack: error.stack,
    });

    // Still return 200 to prevent Midtrans from retrying
    res.status(200).json({ status: "error", message: error.message });
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (transaksi, paymentData) => {
  await prisma.$transaction(async (tx) => {
    console.log ("Transaksi on3", transaksi)
    // Update transaksi status
    await tx.transaksi.update({
      where: { transaksi_id: transaksi.transaksi_id },
      data: {
        order_status: "CONFIRMED",
        status_pembayaran: "LUNAS",
        tanggal_lunas: new Date(),
        confirmed_at: new Date(),
      },
    });

    // Update pembayaran
    await tx.pembayaran.updateMany({
      where: {
        transaksi_id: transaksi.transaksi_id,
        status: "PENDING",
      },
      data: {
        status: "SUKSES",
        paid_at: new Date(),
        raw_response: paymentData,
        provider: paymentData.payment_type || "midtrans",
        nomor_referensi: paymentData.transaction_id,
      },
    });

    // Reduce stock with row locking
    for (const detail of transaksi.transaksi_detail) {
      // Lock the product row
      await tx.$queryRaw`
        SELECT produk_id FROM produk 
        WHERE produk_id = ${detail.produk_id} 
        FOR UPDATE
      `;

      // Check stock
      const product = await tx.produk.findUnique({
        where: { id: detail.produk_id },
      });

      if (product && product.stok !== null) {
        if (product.stok < detail.jumlah) {
          // Stock insufficient — still confirm but log warning
          logger.warn("Insufficient stock during payment confirmation", {
            produk_id: detail.produk_id,
            available: product.stok,
            requested: detail.jumlah,
            transaksi_id: transaksi.transaksi_id,
          });
        }

        // Reduce stock
        await tx.produk.update({
          where: { id: detail.produk_id },
          data: { stok: { decrement: detail.jumlah } },
        });

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            produkId: detail.produk_id,
            referenceId: transaksi.transaksi_id,
            referenceType: "PENJUALAN_ONLINE",
            quantity: -detail.jumlah,
            keterangan: `Pembayaran online ${transaksi.nomor_transaksi}`,
            userId: "system",
            cabangId: transaksi.cabang_id,
          },
        });
      }
    }
  });

  // Send WA notifications (non-blocking)
  orderNotification.sendPaymentSuccessNotification(transaksi.transaksi_id).catch(() => {});
  logger.info("Payment success, WA notification sent", {
    transaksi_id: transaksi.transaksi_id,
  });
};

/**
 * Handle failed/expired/cancelled payment
 */
const handlePaymentFailed = async (transaksi, paymentData) => {
  await prisma.$transaction(async (tx) => {
    // Update transaksi
    await tx.transaksi.update({
      where: { transaksi_id: transaksi.transaksi_id },
      data: {
        order_status: "CANCELLED",
        status_pembayaran: "DIBATALKAN",
        order_cancelled_reason:
          `Payment ${paymentData.transaction_status || "failed"}`,
      },
    });

    // Update pembayaran
    await tx.pembayaran.updateMany({
      where: {
        transaksi_id: transaksi.transaksi_id,
        status: "PENDING",
      },
      data: {
        status: "GAGAL",
        raw_response: paymentData,
      },
    });

    // Create cancellation record
    await tx.order_cancellation.create({
      data: {
        transaksi_id: transaksi.transaksi_id,
        cancellation_reason:
          `Payment ${paymentData.transaction_status || "failed"}`,
        cancelled_at: new Date(),
      },
    });
  });

  // Send WA cancellation notification (non-blocking)
  orderNotification.sendOrderStatusUpdate(transaksi.transaksi_id, "CANCELLED").catch(() => {});
};

module.exports = {
  handleMidtransWebhook,
};
