// Scheduler untuk memeriksa stok secara berkala dan membuat notifikasi
const cron = require("node-cron");
const notificationService = require("../services/notificationService");
const { logger} = require("../utils/logger");

// Setup daily scheduled tasks
const setupNotificationScheduler = () => {
  // Check low stock every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    try {
      logger.info("Running scheduled low stock check");
      const notifications = await notificationService.checkLowStock();
      logger.info(`Created ${notifications.length} low stock notifications`);
    } catch (error) {
      logger.error("Error in scheduled low stock check:", error);
    }
  });

  // Check expiring stock every day at 8:30 AM
  cron.schedule("30 8 * * *", async () => {
    try {
      logger.info("Running scheduled expiring stock check");
      const notifications = await notificationService.checkExpiringStock();
      logger.info(
        `Created ${notifications.length} expiring stock notifications`
      );
    } catch (error) {
      logger.error("Error in scheduled expiring stock check:", error);
    }
  });

  logger.info("Notification scheduler setup complete");
};

module.exports = {
  setupNotificationScheduler,
};
