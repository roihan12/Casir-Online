const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Buat folder logs jika belum ada
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Konfigurasi format
const { combine, timestamp, printf, colorize, json } = winston.format;

// Format khusus untuk console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `[${timestamp}] ${level}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
  }`;
});

// Buat logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "prisma-service" },
  format: combine(timestamp(), json()),
  transports: [
    // Log ke file dengan rotasi harian
    new winston.transports.File({
      filename: path.join(
        logDir,
        `prisma-error-${new Date().toISOString().split("T")[0]}.log`
      ),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(
        logDir,
        `prisma-combined-${new Date().toISOString().split("T")[0]}.log`
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Tambahkan console transport di development mode
logger.add(
  new winston.transports.Console({
    format: combine(colorize(), timestamp(), consoleFormat),
  })
);

module.exports = { logger };
