// Start the PostgreSQL view refresh listener
const viewRefreshService = require("./services/viewRefreshService");
const { logger } = require("./utils/logger");

viewRefreshService.startListener().catch((err) => {
  logger.error("Failed to start view refresh listener:", err);
});
