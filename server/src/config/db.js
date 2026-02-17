const { PrismaClient } = require("@prisma/client");
const { logger } = require("../utils/logger");
require("dotenv").config();

// Axios client for Face Recognition Service
const axios = require("axios");

const faceServiceClient = axios.create({
  baseURL: process.env.FACE_SERVICE_URL || "http://localhost:8001",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "X-API-Key": process.env.FACE_SERVICE_API_KEY || "face-service-api-key",
    "Content-Type": "multipart/form-data",
  },
});

// Response interceptor for error handling
faceServiceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("Face Service Error", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      throw new Error("Invalid face service API key");
    }

    if (error.response?.status === 404) {
      throw new Error("Face service endpoint not found");
    }

    if (error.code === "ECONNREFUSED") {
      throw new Error("Face recognition service is not available");
    }

    throw error;
  }
);

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


// Export for backward compatibility - existing code uses: const prisma = require("../config/db")
module.exports = prisma;
// Also export named properties for when needed
module.exports.prisma = prisma;
module.exports.faceServiceClient = faceServiceClient;
