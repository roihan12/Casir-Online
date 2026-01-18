const Redis = require("ioredis");

// // Baca konfigurasi dari environment variable
// const redisConfig = {
//   host: process.env.REDIS_HOST || "localhost",
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || "",
//   db: process.env.REDIS_DB || 0,
//   // Tambahkan opsi reconnect yang lebih robust
//   maxRetriesPerRequest: null,
//   retryStrategy(times) {
//     const delay = Math.min(times * 100, 3000);
//     return delay;
//   },
//   // Tambahkan opsi enable readyCheck
//   enableReadyCheck: true,
//   // Tambahkan opsi keepAlive
//   keepAlive: 10000,
// };

// Buat instance Redis client
const redisClient = new Redis(
  process.env.REDIS_URL
);


// Health check function
const healthCheck = async () => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
};

redisClient.set

// Event listeners
redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("ready", () => {
  console.log("Redis client ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis client reconnecting");
});

redisClient.on("end", () => {
  console.log("Redis connection ended");
});

// Fungsi untuk membersihkan resources saat aplikasi dihentikan
const cleanup = async () => {
  console.log("Closing Redis connection...");
  await redisClient.quit();
};

// Export
module.exports = {
  redisClient,
  healthCheck,
  cleanup,
};
