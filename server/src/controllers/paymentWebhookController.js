const { basePrisma } = require("../config/db");
const midtransService = require("../services/midtransService");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const orderNotification = require("../services/orderNotificationService");

/**
 * Helper: Run webhook operations with RLS context
 * Webhook is public (no auth), so we must SET LOCAL manually
 * using the cabang_id from the transaksi
 */
const withWebhookRls = async (cabangId, callback) => {
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_cabang_ids = '${cabangId.replace(/'/g, "''")}'`
    );
    return callback(tx);
  }, { timeout: 30000 });
};

/**
 * Handle Midtrans webhook notification
 * POST /api/payment/webhook/midtrans
 */
const handleMidtransWebhook = async (req, res, next) => {
  try {
    const notification = req.body;

    // 1. Log the webhook request (payment_webhook_log is NOT RLS-protected)
    await basePrisma.payment_webhook_log.create({
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

    logger.info("result", result);

    if (!result || !result.order_id) {
      return res.status(200).json({ status: "ok" });
    }

    // 3. Find the transaction
    //    RLS blocks all rows when app.current_cabang_ids is not set.
    //    Webhook has no auth context, so we first get ALL cabang IDs
    //    (cabang table is NOT RLS-protected) and SET LOCAL to bypass RLS.
    const rawTransaksi = await basePrisma.$transaction(async (tx) => {
      // Get all cabang IDs (cabang table has no RLS)
      const allCabang = await tx.cabang.findMany({
        select: { id: true },
      });
      const allCabangIds = allCabang.map((c) => c.id).join(",");

      // SET LOCAL with all cabang IDs to bypass RLS
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_cabang_ids = '${allCabangIds}'`
      );

      return tx.transaksi.findFirst({
        where: {
          transaksi_id: result.order_id,
        },
        select: {
          transaksi_id: true,
          cabang_id: true,
          order_status: true,
          status_pembayaran: true,
          nomor_transaksi: true,
        },
      });
    });

    if (!rawTransaksi) {
      logger.warn("Webhook received for unknown transaction", {
        order_id: result.order_id,
      });
      return res.status(200).json({ status: "ok" });
    }

    // 4. Check idempotency — skip if already processed
    if (
      rawTransaksi.order_status === "COMPLETED" ||
      rawTransaksi.order_status === "CANCELLED"
    ) {
      return res.status(200).json({ status: "ok", message: "Already processed" });
    }

    // 5. Now fetch full transaksi with details using RLS context (cabang_id)
    const transaksi = await withWebhookRls(rawTransaksi.cabang_id, async (tx) => {
      return tx.transaksi.findFirst({
        where: {
          transaksi_id: result.order_id,
        },
        include: {
          transaksi_detail: true,
        },
      });
    });

    logger.info("transaksi FULL", transaksi);

    if (!transaksi) {
      logger.warn("Webhook: transaksi not found after RLS set", {
        order_id: result.order_id,
        cabang_id: rawTransaksi.cabang_id,
      });
      return res.status(200).json({ status: "ok" });
    }

    // 6. Process based on payment status
    if (result.status === "SUKSES") {
      await handlePaymentSuccess(transaksi, result);
    } else if (result.status === "GAGAL") {
      await handlePaymentFailed(transaksi, result);
    }
    // PENDING status — no action needed

    // 7. Update webhook log as processed
    await basePrisma.payment_webhook_log.updateMany({
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

  // Use withWebhookRls so all operations run with proper cabang_id SET LOCAL
  await withWebhookRls(transaksi.cabang_id, async (tx) => {
    // Find a valid userId from this cabang for inventory movements
    const cabangUser = await tx.$queryRawUnsafe(
      `SELECT user_id FROM user_cabang WHERE cabang_id = $1 LIMIT 1`,
      transaksi.cabang_id
    );
    const systemUserId = cabangUser.length > 0 ? cabangUser[0].user_id : null;

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



        // Create inventory movement (only if we have a valid user)
        if (systemUserId) {
          await tx.inventoryMovement.create({
            data: {
              produkId: detail.produk_id,
              referenceId: transaksi.transaksi_id,
              referenceType: "PENJUALAN_ONLINE",
              quantity: -detail.jumlah,
              keterangan: `Pembayaran online ${transaksi.nomor_transaksi}`,
              userId: systemUserId,
              cabangId: transaksi.cabang_id,
            },
          });
        }
      }
    }
  });

  // Send WA notifications (non-blocking)
  orderNotification.sendPaymentSuccessNotification(transaksi).catch(() => {});
  logger.info("Payment success, WA notification sent", {
    transaksi_id: transaksi.transaksi_id,
  });
};

/**
 * Handle failed/expired/cancelled payment
 */
const handlePaymentFailed = async (transaksi, paymentData) => {
  // Use withWebhookRls so all operations run with proper cabang_id SET LOCAL
  await withWebhookRls(transaksi.cabang_id, async (tx) => {
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

