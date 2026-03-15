const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Buat folder logs jika belum ada
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// ============================================================
// Custom format: otomatis serialize Error objects ke dalam log
// ============================================================
const enumerateErrorFormat = winston.format((info) => {
  // Jika message adalah Error object, extract properties-nya
  if (info.message instanceof Error) {
    info.message = {
      message: info.message.message,
      stack: info.message.stack,
      ...(info.message.code && { code: info.message.code }),
    };
  }

  // Jika ada error di meta (e.g. logger.error('msg', { error: err }))
  if (info.error instanceof Error) {
    info.error = {
      message: info.error.message,
      stack: info.error.stack,
      ...(info.error.code && { code: info.error.code }),
    };
  }

  return info;
});

// ============================================================
// Console format: readable, colored, multi-line untuk dev
// ============================================================
const consoleFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  // Base log line
  let log = `[${timestamp}] ${level} [${service}]: ${message}`;

  // Filter out keys yang tidak perlu ditampilkan
  const filteredMeta = { ...meta };
  delete filteredMeta.stack; // stack akan tampil terpisah di bawah

  // Tampilkan meta data jika ada (selain stack)
  if (Object.keys(filteredMeta).length > 0) {
    log += `\n  📋 Meta: ${JSON.stringify(filteredMeta, null, 2).split("\n").join("\n  ")}`;
  }

  // Tampilkan stack trace di baris terpisah supaya mudah dibaca
  if (meta.stack) {
    log += `\n  🔍 Stack: ${meta.stack}`;
  }

  return log;
});

// ============================================================
// File format: structured JSON untuk parsing & search
// ============================================================
const fileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS Z" }),
  enumerateErrorFormat(),
  errors({ stack: true }),
  json()
);

// ============================================================
// Logger instance
// ============================================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "prisma-service" },
  format: fileFormat,
  transports: [
    // Error-only log file
    new winston.transports.File({
      filename: path.join(
        logDir,
        `prisma-error-${new Date().toISOString().split("T")[0]}.log`
      ),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // Combined log file (semua level)
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

// Console transport — selalu aktif supaya Docker logs bisa dilihat
logger.add(
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS Z" }),
      enumerateErrorFormat(),
      errors({ stack: true }),
      consoleFormat
    ),
  })
);

module.exports = { logger };
