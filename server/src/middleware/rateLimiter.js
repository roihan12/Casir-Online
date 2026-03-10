const rateLimit = require("express-rate-limit");

// 1. Limiter untuk Login (Mencegah Brute Force)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // Maksimal 5 request
  message: {
    success: false,
    message: "Terlalu banyak percobaan login, silakan coba lagi setelah 1 menit",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Limiter untuk WhatsApp dan Broadcast (Mencegah WA Banned/Spamming)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // Maksimal 10 request
  message: {
    success: false,
    message: "Terlalu banyak permintaan pengiriman pesan, silakan tunggu sebentar",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Limiter untuk Upload (Mencegah Disk Exhaustion/DoS)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // Maksimal 10 request upload
  message: {
    success: false,
    message: "Terlalu banyak permintaan unggah file, silakan coba beberapa saat lagi",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Limiter untuk Absensi/Koreksi (Mencegah Fraud/Spam)
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // Maksimal 5 request
  message: {
    success: false,
    message: "Terlalu banyak permintaan absensi/koreksi, silakan coba lagi.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  messageLimiter,
  uploadLimiter,
  attendanceLimiter,
};
