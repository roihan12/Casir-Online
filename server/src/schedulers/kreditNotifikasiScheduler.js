const cron = require("node-cron");
const kreditNotifikasiService = require("../services/kreditNotifikasiService");
const { logger } = require("../utils/logger");

/**
 * Menjalankan tugas pembuatan notifikasi pengingat pembayaran kredit
 * Dijalankan setiap hari pada pukul 07:00 pagi
 */
const runCreatePaymentReminders = async () => {
  try {
    logger.info(
      "Menjalankan tugas pembuatan notifikasi pengingat pembayaran kredit"
    );

    const options = {
      daysBefore: 3, // Pengingat 3 hari sebelum jatuh tempo
      daysAfter: 1, // Pengingat 1 hari setelah jatuh tempo
      metodePengiriman: ["EMAIL", "APP_NOTIFICATION"], // Metode pengiriman default
    };

    const createdNotifications =
      await kreditNotifikasiService.createPaymentReminderNotifications(options);

    logger.info(
      `Berhasil membuat ${createdNotifications.length} notifikasi pengingat pembayaran kredit`
    );
  } catch (error) {
    logger.error(
      "Gagal menjalankan tugas pembuatan notifikasi pengingat pembayaran kredit",
      {
        error: error.message,
        stack: error.stack,
      }
    );
  }
};

/**
 * Menjalankan tugas pengiriman notifikasi kredit yang belum terkirim
 * Dijalankan setiap 30 menit
 */
const runSendPendingNotifications = async () => {
  try {
    logger.info(
      "Menjalankan tugas pengiriman notifikasi kredit yang belum terkirim"
    );

    const sentNotifications =
      await kreditNotifikasiService.sendPendingNotifications();

    if (sentNotifications.length > 0) {
      logger.info(
        `Berhasil mengirim ${sentNotifications.length} notifikasi kredit yang tertunda`
      );
    } else {
      logger.info("Tidak ada notifikasi kredit tertunda yang perlu dikirim");
    }
  } catch (error) {
    logger.error(
      "Gagal menjalankan tugas pengiriman notifikasi kredit yang belum terkirim",
      {
        error: error.message,
        stack: error.stack,
      }
    );
  }
};

/**
 * Mengatur jadwal tugas otomatis terkait notifikasi kredit
 */
const setupKreditNotifikasiScheduler = () => {
  // Jalankan pembuatan notifikasi pengingat pembayaran kredit setiap hari pukul 07:00 pagi
  cron.schedule("0 7 * * *", runCreatePaymentReminders);

  // Jalankan pengiriman notifikasi kredit yang belum terkirim setiap 30 menit
  cron.schedule("*/30 * * * *", runSendPendingNotifications);

  logger.info("Scheduler notifikasi kredit berhasil diatur");
};

module.exports = {
  setupKreditNotifikasiScheduler,
  runCreatePaymentReminders,
  runSendPendingNotifications,
};
