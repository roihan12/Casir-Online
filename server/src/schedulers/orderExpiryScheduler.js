const prisma = require("../config/db");
const { logger } = require("../utils/logger");

/**
 * Order Expiry Scheduler
 * Cancels PENDING online orders that have expired (order_expired_at < now)
 * Runs every 5 minutes
 */

const cancelExpiredOrders = async () => {
  try {
    const now = new Date();

    // Find expired PENDING orders
    const expiredOrders = await prisma.transaksi.findMany({
      where: {
        order_source: "ECATALOG",
        order_status: "PENDING",
        order_expired_at: {
          lt: now,
        },
      },
      select: {
        transaksi_id: true,
        nomor_transaksi: true,
        cabang_id: true,
      },
    });

    if (expiredOrders.length === 0) {
      return;
    }

    logger.info(`Found ${expiredOrders.length} expired orders to cancel`);

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update order status
          await tx.transaksi.update({
            where: { transaksi_id: order.transaksi_id },
            data: {
              order_status: "CANCELLED",
              status_pembayaran: "DIBATALKAN",
              order_cancelled_reason: "Pembayaran expired",
            },
          });

          // Update pembayaran
          await tx.pembayaran.updateMany({
            where: {
              transaksi_id: order.transaksi_id,
              status: "PENDING",
            },
            data: { status: "GAGAL" },
          });

          // Create cancellation record
          await tx.order_cancellation.create({
            data: {
              transaksi_id: order.transaksi_id,
              cancellation_reason: "Pembayaran expired (auto-cancel)",
              cancelled_at: now,
            },
          });
        });

        logger.info(`Cancelled expired order: ${order.nomor_transaksi}`);
      } catch (err) {
        logger.error(
          `Failed to cancel expired order ${order.nomor_transaksi}:`,
          err.message
        );
      }
    }
  } catch (error) {
    logger.error("Order expiry scheduler error:", error.message);
  }
};

/**
 * Setup the scheduler to run every 5 minutes
 */
const setupOrderExpiryScheduler = () => {
  const INTERVAL = 5 * 60 * 1000; // 5 minutes

  logger.info("Order expiry scheduler started (every 5 minutes)");

  // Run immediately on startup
  cancelExpiredOrders();

  // Then run every 5 minutes
  setInterval(cancelExpiredOrders, INTERVAL);
};

module.exports = {
  cancelExpiredOrders,
  setupOrderExpiryScheduler,
};
