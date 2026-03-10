// config/initializer.js
const { redisClient, healthCheck, cleanup } = require("./redis");
const { logger } = require("../utils/logger");


const initialize = async () => {
  // Redis health check
  const redisStatus = await healthCheck();
  if (!redisStatus) {
    logger.error("Redis health check failed!");
  } else {
    logger.info("Redis connection successful");
  }

  // Tangani shutdown gracefully
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM signal received");
    await cleanup();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT signal received");
    await cleanup();
    process.exit(0);
  });
};

module.exports = { initialize };
