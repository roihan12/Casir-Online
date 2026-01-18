const { PrismaClient } = require("@prisma/client");
const { logger } = require("../utils/logger");
require("dotenv").config();

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Event listener untuk query
prisma.$on("query", (e) => {
  logger.debug("Prisma Query", {
    query: e.query,
    params: e.params,
    duration: e.duration,
  });
});

// Event listener untuk error
prisma.$on("error", (e) => {
  logger.error("Prisma Error", {
    message: e.message,
    target: e.target,
  });
});

//Event listener untuk info
prisma.$on("info", (e) => {
  logger.info("Prisma Info", {
    message: e.message,
    target: e.target,
  });
});

// Event listener untuk warn
prisma.$on("warn", (e) => {
  logger.warn("Prisma Warning", {
    message: e.message,
    target: e.target,
  });
});

// Middleware untuk mengukur kinerja
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  const { model, action, args } = params;

  logger.info("Prisma operation started", {
    model,
    action,
    args,
  });

  try {
    const result = await next(params);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log operasi yang berjalan lebih dari 100ms
    if (duration > 300) {
      logger.warn("Slow Prisma operation", {
        model,
        action,
        duration,
        args,
      });
    } else {
      logger.debug("Prisma operation completed", {
        model,
        action,
        duration,
      });
    }

    return result;
  } catch (error) {
    const endTime = Date.now();

    logger.error("Prisma operation failed", {
      model,
      action,
      duration: endTime - startTime,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
});

// Fungsi untuk menangani koneksi pada shutdown
const handleShutdown = async () => {
  logger.info("Closing Prisma connection pool...");

  await prisma.$disconnect();

  logger.info("Prisma connection pool closed");

  // Memberikan waktu untuk logger menulis pesan terakhir
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Listener untuk shutdown aplikasi
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

module.exports = prisma;
