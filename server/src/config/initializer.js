// config/initializer.js
const { redisClient, healthCheck, cleanup } = require("./redis");

const initialize = async () => {
  // Redis health check
  const redisStatus = await healthCheck();
  if (!redisStatus) {
    console.error("Redis health check failed!");
  } else {
    console.log("Redis connection successful");
  }

  // Tangani shutdown gracefully
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received");
    await cleanup();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT signal received");
    await cleanup();
    process.exit(0);
  });
};

module.exports = { initialize };
