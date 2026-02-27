const { PrismaClient } = require("@prisma/client");
const { logger } = require("../utils/logger");
const { getRlsContext } = require("../utils/rlsContext");
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

// =============================================
// Base Prisma Client (tanpa RLS)
// Digunakan untuk raw queries dan operasi internal
// =============================================
const basePrisma = new PrismaClient({
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
basePrisma.$on("query", (e) => {
  logger.debug("Prisma Query", {
    query: e.query,
    params: e.params,
    duration: e.duration,
  });
});

// Event listener untuk error
basePrisma.$on("error", (e) => {
  logger.error("Prisma Error", {
    message: e.message,
    target: e.target,
  });
});

//Event listener untuk info
basePrisma.$on("info", (e) => {
  logger.info("Prisma Info", {
    message: e.message,
    target: e.target,
  });
});

// Event listener untuk warn
basePrisma.$on("warn", (e) => {
  logger.warn("Prisma Warning", {
    message: e.message,
    target: e.target,
  });
});

// Middleware untuk mengukur kinerja (pada basePrisma)
basePrisma.$use(async (params, next) => {
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

    // Log operasi yang berjalan lebih dari 300ms
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

// =============================================
// Extended Prisma Client DENGAN RLS
// Setiap query model di-wrap dalam interactive $transaction
// sehingga SET LOCAL dan query berjalan di koneksi yang SAMA
// =============================================
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = getRlsContext();

        // Jika tidak ada RLS context (belum login/request tanpa auth),
        // jalankan query langsung tanpa SET LOCAL
        if (!ctx || !ctx.userId) {
          return query(args);
        }

        // Wrap dalam interactive transaction agar SET LOCAL dan query
        // berjalan di koneksi PostgreSQL yang SAMA
        const modelName = model.charAt(0).toLowerCase() + model.slice(1);

        return basePrisma.$transaction(async (tx) => {
          // Set session variables yang dibaca oleh RLS policies
          await tx.$executeRawUnsafe(
            `SET LOCAL app.current_user_id = '${ctx.userId.replace(/'/g, "''")}'`
          );

          if (ctx.cabangIds && ctx.cabangIds.length > 0) {
            const sanitized = ctx.cabangIds
              .map((id) => id.replace(/'/g, "''"))
              .join(",");
            await tx.$executeRawUnsafe(
              `SET LOCAL app.current_cabang_ids = '${sanitized}'`
            );
          }

          // Jalankan query original pada transaction client yang sama
          return tx[modelName][operation](args);
        });
      },
    },
  },
});

// Fungsi untuk menangani koneksi pada shutdown
const handleShutdown = async () => {
  logger.info("Closing Prisma connection pool...");

  await basePrisma.$disconnect();

  logger.info("Prisma connection pool closed");

  // Memberikan waktu untuk logger menulis pesan terakhir
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Listener untuk shutdown aplikasi
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

// Export extended client sebagai default
// Semua existing code yang require("../config/db") akan otomatis pakai RLS
// =============================================
// Helper: withRls() - Wrap raw queries dalam transaction + SET LOCAL
// Digunakan untuk $queryRaw/$executeRaw yang TIDAK di-wrap oleh $extends
//
// Contoh penggunaan:
//   const result = await withRls(tx => tx.$queryRaw`SELECT * FROM transaksi WHERE ...`);
// =============================================
const withRls = async (callback) => {
  const ctx = getRlsContext();

  // Jika tidak ada context, jalankan langsung tanpa transaction
  if (!ctx || !ctx.userId) {
    return callback(basePrisma);
  }

  // Wrap dalam interactive transaction agar SET LOCAL + query di koneksi yang sama
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${ctx.userId.replace(/'/g, "''")}'`
    );

    if (ctx.cabangIds && ctx.cabangIds.length > 0) {
      const sanitized = ctx.cabangIds
        .map((id) => id.replace(/'/g, "''"))
        .join(",");
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_cabang_ids = '${sanitized}'`
      );
    }

    return callback(tx);
  });
};

// Export extended client sebagai default
module.exports = prisma;
// Also export named properties for when needed
module.exports.prisma = prisma;
module.exports.basePrisma = basePrisma;
module.exports.withRls = withRls;
module.exports.faceServiceClient = faceServiceClient;

