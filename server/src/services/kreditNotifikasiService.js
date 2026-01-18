const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const nodemailer = require("nodemailer");
const moment = require("moment");

/**
 * Membuat pesan default berdasarkan jenis notifikasi
 * @param {String} jenisNotifikasi - Jenis notifikasi
 * @param {Object} data - Data untuk pesan
 * @returns {String} - Pesan default
 */
const generateDefaultMessage = (jenisNotifikasi, data) => {
  const { pelangganNama, angsuranKe, jumlahTagihan, tanggalJatuhTempo, nomorTransaksi } = data;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(jumlahTagihan);
  
  switch (jenisNotifikasi) {
    case 'PENGINGAT_SEBELUM_JATUH_TEMPO':
      return `Yth. ${pelangganNama}, pembayaran angsuran ke-${angsuranKe} sebesar ${formattedAmount} untuk transaksi ${nomorTransaksi} akan jatuh tempo pada ${tanggalJatuhTempo}. Mohon siapkan pembayaran Anda.`;
    
    case 'PENGINGAT_HARI_JATUH_TEMPO':
      return `Yth. ${pelangganNama}, hari ini adalah tanggal jatuh tempo pembayaran angsuran ke-${angsuranKe} sebesar ${formattedAmount} untuk transaksi ${nomorTransaksi}. Mohon lakukan pembayaran hari ini.`;
    
    case 'PENGINGAT_SETELAH_JATUH_TEMPO':
      return `Yth. ${pelangganNama}, pembayaran angsuran ke-${angsuranKe} sebesar ${formattedAmount} untuk transaksi ${nomorTransaksi} telah melewati tanggal jatuh tempo ${tanggalJatuhTempo}. Mohon segera lakukan pembayaran untuk menghindari denda.`;
    
    case 'PEMBAYARAN_TERLAMBAT':
      return `Yth. ${pelangganNama}, pembayaran angsuran ke-${angsuranKe} sebesar ${formattedAmount} untuk transaksi ${nomorTransaksi} telah terlambat. Mohon segera lakukan pembayaran termasuk denda keterlambatan.`;
    
    case 'PEMBAYARAN_BERHASIL':
      return `Terima kasih ${pelangganNama}, pembayaran angsuran ke-${angsuranKe} sebesar ${formattedAmount} untuk transaksi ${nomorTransaksi} telah kami terima.`;
    
    case 'KREDIT_LUNAS':
      return `Selamat ${pelangganNama}! Seluruh angsuran untuk transaksi ${nomorTransaksi} telah lunas. Terima kasih atas kerjasamanya.`;
    
    default:
      return `Notifikasi kredit untuk ${pelangganNama} terkait transaksi ${nomorTransaksi}.`;
  }
};

/**
 * Membuat notifikasi kredit baru
 * @param {Object} data - Data notifikasi kredit
 * @returns {Promise<Object>} - Notifikasi kredit yang dibuat
 */
const createKreditNotifikasi = async (data) => {
  const {
    kreditTransaksiId,
    pelangganId,
    angsuranKe,
    jumlahTagihan,
    tanggalJatuhTempo,
    jenisNotifikasi,
    metodePengiriman,
    pesanNotifikasi,
  } = data;

  // Validasi data
  if (!kreditTransaksiId) {
    throw new ResponseError(400, "ID transaksi kredit harus diisi");
  }

  if (!pelangganId) {
    throw new ResponseError(400, "ID pelanggan harus diisi");
  }

  if (!tanggalJatuhTempo) {
    throw new ResponseError(400, "Tanggal jatuh tempo harus diisi");
  }

  if (!jenisNotifikasi) {
    throw new ResponseError(400, "Jenis notifikasi harus diisi");
  }

  if (!metodePengiriman || metodePengiriman.length === 0) {
    throw new ResponseError(400, "Metode pengiriman harus diisi");
  }

  // Cek apakah transaksi kredit ada
  const kreditTransaksi = await prisma.kreditTransaksi.findUnique({
    where: { id: kreditTransaksiId },
    include: {
      transaksi: true,
    },
  });

  if (!kreditTransaksi) {
    throw new ResponseError(404, "Transaksi kredit tidak ditemukan");
  }

  // Cek apakah pelanggan ada
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  // Buat notifikasi kredit
  const kreditNotifikasi = await prisma.kreditNotifikasi.create({
    data: {
      kreditTransaksiId,
      pelangganId,
      angsuranKe,
      jumlahTagihan,
      tanggalJatuhTempo,
      jenisNotifikasi,
      metodePengiriman,
      pesanNotifikasi: pesanNotifikasi || generateDefaultMessage(jenisNotifikasi, {
        pelangganNama: pelanggan.nama,
        angsuranKe,
        jumlahTagihan,
        tanggalJatuhTempo: moment(tanggalJatuhTempo).format("DD MMMM YYYY"),
        nomorTransaksi: kreditTransaksi.transaksi.nomor_transaksi,
      }),
    },
  });

  return kreditNotifikasi;
};

/**
 * Mengirim notifikasi kredit
 * @param {String} notifikasiId - ID notifikasi kredit
 * @returns {Promise<Object>} - Notifikasi kredit yang dikirim
 */
const sendKreditNotifikasi = async (notifikasiId) => {
  // Cek apakah notifikasi ada
  const notifikasi = await prisma.kreditNotifikasi.findUnique({
    where: { id: notifikasiId },
    include: {
      kreditTransaksi: {
        include: {
          transaksi: true,
        },
      },
      pelanggan: true,
    },
  });

  if (!notifikasi) {
    throw new ResponseError(404, "Notifikasi kredit tidak ditemukan");
  }

  // Jika notifikasi sudah dikirim, kembalikan notifikasi
  if (notifikasi.statusNotifikasi === "terkirim") {
    return notifikasi;
  }

  // Kirim notifikasi berdasarkan metode pengiriman
  let isSuccess = false;
  const metodePengiriman = notifikasi.metodePengiriman;

  for (const metode of metodePengiriman) {
    try {
      switch (metode) {
        case "EMAIL":
          await sendEmailNotifikasi(notifikasi);
          isSuccess = true;
          break;
        case "SMS":
          // Implementasi pengiriman SMS di sini
          // await sendSmsNotifikasi(notifikasi);
          isSuccess = true;
          break;
        case "WHATSAPP":
          // Implementasi pengiriman WhatsApp di sini
          // await sendWhatsappNotifikasi(notifikasi);
          isSuccess = true;
          break;
        case "APP_NOTIFICATION":
          // Implementasi pengiriman notifikasi aplikasi di sini
          // await sendAppNotifikasi(notifikasi);
          isSuccess = true;
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error sending ${metode} notification:`, error);
    }
  }

  // Update status notifikasi
  const updatedNotifikasi = await prisma.kreditNotifikasi.update({
    where: { id: notifikasiId },
    data: {
      statusNotifikasi: isSuccess ? "terkirim" : "gagal",
      tanggalKirim: isSuccess ? new Date() : null,
    },
  });

  return updatedNotifikasi;
};

/**
 * Mengirim notifikasi kredit melalui email
 * @param {Object} notifikasi - Notifikasi kredit
 * @returns {Promise<boolean>} - Status pengiriman
 */
const sendEmailNotifikasi = async (notifikasi) => {
  const { pelanggan, pesanNotifikasi } = notifikasi;
  
  if (!pelanggan.email) {
    throw new ResponseError(400, "Email pelanggan tidak tersedia");
  }

  // Konfigurasi transporter email
  const transporter = nodemailer.createTransport({
    // Konfigurasi SMTP
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Opsi email
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Casir Online" <noreply@casironline.com>',
    to: pelanggan.email,
    subject: `Notifikasi Kredit - ${getNotifikasiSubject(notifikasi.jenisNotifikasi)}`,
    text: pesanNotifikasi,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Notifikasi Kredit</h2>
            <p>${pesanNotifikasi}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>`,
  };

  // Kirim email
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

/**
 * Mendapatkan subjek notifikasi berdasarkan jenis notifikasi
 * @param {String} jenisNotifikasi - Jenis notifikasi
 * @returns {String} - Subjek notifikasi
 */
const getNotifikasiSubject = (jenisNotifikasi) => {
  switch (jenisNotifikasi) {
    case "PENGINGAT_SEBELUM_JATUH_TEMPO":
      return "Pengingat Pembayaran Angsuran";
    case "PENGINGAT_HARI_JATUH_TEMPO":
      return "Pembayaran Angsuran Jatuh Tempo Hari Ini";
    case "PENGINGAT_SETELAH_JATUH_TEMPO":
      return "Pembayaran Angsuran Telah Melewati Jatuh Tempo";
    case "PEMBAYARAN_TERLAMBAT":
      return "Pembayaran Angsuran Terlambat";
    case "PEMBAYARAN_BERHASIL":
      return "Konfirmasi Pembayaran Angsuran";
    case "KREDIT_LUNAS":
      return "Kredit Telah Lunas";
    default:
      return "Notifikasi Kredit";
  }
};

/**
 * Mendapatkan daftar notifikasi kredit
 * @param {Object} filters - Filter untuk notifikasi kredit
 * @returns {Promise<Object>} - Daftar notifikasi kredit
 */
const getKreditNotifikasi = async (filters) => {
  const {
    kreditTransaksiId,
    pelangganId,
    jenisNotifikasi,
    statusNotifikasi,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  // Buat kondisi where
  const where = {};

  if (kreditTransaksiId) {
    where.kreditTransaksiId = kreditTransaksiId;
  }

  if (pelangganId) {
    where.pelangganId = pelangganId;
  }

  if (jenisNotifikasi) {
    where.jenisNotifikasi = jenisNotifikasi;
  }

  if (statusNotifikasi) {
    where.statusNotifikasi = statusNotifikasi;
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.createdAt = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.createdAt = {
      lte: new Date(endDate),
    };
  }

  // Hitung total notifikasi
  const total = await prisma.kreditNotifikasi.count({ where });

  // Ambil notifikasi dengan pagination
  const notifikasi = await prisma.kreditNotifikasi.findMany({
    where,
    include: {
      kreditTransaksi: {
        include: {
          transaksi: true,
        },
      },
      pelanggan: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: Number(limit),
  });

  return {
    data: notifikasi,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Menandai notifikasi kredit telah dibaca
 * @param {String} notifikasiId - ID notifikasi kredit
 * @returns {Promise<Object>} - Notifikasi kredit yang telah dibaca
 */
const markNotifikasiRead = async (notifikasiId) => {
  // Cek apakah notifikasi ada
  const notifikasi = await prisma.kreditNotifikasi.findUnique({
    where: { id: notifikasiId },
  });

  if (!notifikasi) {
    throw new ResponseError(404, "Notifikasi kredit tidak ditemukan");
  }

  // Jika notifikasi sudah dibaca, kembalikan notifikasi
  if (notifikasi.isRead) {
    return notifikasi;
  }

  // Update status notifikasi
  const updatedNotifikasi = await prisma.kreditNotifikasi.update({
    where: { id: notifikasiId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return updatedNotifikasi;
};

/**
 * Membatalkan notifikasi kredit
 * @param {String} notifikasiId - ID notifikasi kredit
 * @returns {Promise<Object>} - Notifikasi kredit yang dibatalkan
 */
const cancelKreditNotifikasi = async (notifikasiId) => {
  // Cek apakah notifikasi ada
  const notifikasi = await prisma.kreditNotifikasi.findUnique({
    where: { id: notifikasiId },
  });

  if (!notifikasi) {
    throw new ResponseError(404, "Notifikasi kredit tidak ditemukan");
  }

  // Jika notifikasi sudah dikirim, tidak bisa dibatalkan
  if (notifikasi.statusNotifikasi === "terkirim") {
    throw new ResponseError(400, "Notifikasi yang sudah dikirim tidak dapat dibatalkan");
  }

  // Update status notifikasi
  const updatedNotifikasi = await prisma.kreditNotifikasi.update({
    where: { id: notifikasiId },
    data: {
      statusNotifikasi: "dibatalkan",
    },
  });

  return updatedNotifikasi;
};

/**
 * Membuat notifikasi pengingat pembayaran kredit otomatis
 * @param {Object} options - Opsi untuk membuat notifikasi
 * @returns {Promise<Array>} - Daftar notifikasi yang dibuat
 */
const createPaymentReminderNotifications = async (options = {}) => {
  const {
    daysBefore = 3, // Default 3 hari sebelum jatuh tempo
    daysAfter = 1,  // Default 1 hari setelah jatuh tempo
    metodePengiriman = ["EMAIL", "APP_NOTIFICATION"], // Default metode pengiriman
  } = options;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reminderDate = new Date(today);
  reminderDate.setDate(today.getDate() + daysBefore);
  
  const overdueDate = new Date(today);
  overdueDate.setDate(today.getDate() - daysAfter);
  
  // Cari transaksi kredit yang akan jatuh tempo dalam daysBefore hari
  const upcomingDueTransactions = await prisma.kreditTransaksi.findMany({
    where: {
      statusKredit: "aktif",
      tanggalJatuhTempo: {
        equals: reminderDate,
      },
    },
    include: {
      transaksi: true,
      pembayaranKredit: true,
    },
  });
  
  // Cari transaksi kredit yang sudah jatuh tempo tapi belum dibayar
  const overdueDueTransactions = await prisma.kreditTransaksi.findMany({
    where: {
      statusKredit: "aktif",
      tanggalJatuhTempo: {
        equals: overdueDate,
      },
    },
    include: {
      transaksi: true,
      pembayaranKredit: true,
    },
  });
  
  // Cari transaksi kredit yang jatuh tempo hari ini
  const todayDueTransactions = await prisma.kreditTransaksi.findMany({
    where: {
      statusKredit: "aktif",
      tanggalJatuhTempo: {
        equals: today,
      },
    },
    include: {
      transaksi: true,
      pembayaranKredit: true,
    },
  });
  
  const createdNotifications = [];
  
  // Buat notifikasi untuk transaksi yang akan jatuh tempo
  for (const transaction of upcomingDueTransactions) {
    // Hitung angsuran ke berapa
    const angsuranKe = transaction.pembayaranKredit.length + 1;
    
    // Cek apakah notifikasi sudah ada
    const existingNotification = await prisma.kreditNotifikasi.findFirst({
      where: {
        kreditTransaksiId: transaction.id,
        angsuranKe,
        jenisNotifikasi: "PENGINGAT_SEBELUM_JATUH_TEMPO",
      },
    });
    
    if (!existingNotification) {
      // Buat notifikasi baru
      const notification = await createKreditNotifikasi({
        kreditTransaksiId: transaction.id,
        pelangganId: transaction.transaksi.pelanggan_id,
        angsuranKe,
        jumlahTagihan: transaction.angsuranPerBulan,
        tanggalJatuhTempo: transaction.tanggalJatuhTempo,
        jenisNotifikasi: "PENGINGAT_SEBELUM_JATUH_TEMPO",
        metodePengiriman,
      });
      
      createdNotifications.push(notification);
    }
  }
  
  // Buat notifikasi untuk transaksi yang jatuh tempo hari ini
  for (const transaction of todayDueTransactions) {
    // Hitung angsuran ke berapa
    const angsuranKe = transaction.pembayaranKredit.length + 1;
    
    // Cek apakah notifikasi sudah ada
    const existingNotification = await prisma.kreditNotifikasi.findFirst({
      where: {
        kreditTransaksiId: transaction.id,
        angsuranKe,
        jenisNotifikasi: "PENGINGAT_HARI_JATUH_TEMPO",
      },
    });
    
    if (!existingNotification) {
      // Buat notifikasi baru
      const notification = await createKreditNotifikasi({
        kreditTransaksiId: transaction.id,
        pelangganId: transaction.transaksi.pelanggan_id,
        angsuranKe,
        jumlahTagihan: transaction.angsuranPerBulan,
        tanggalJatuhTempo: transaction.tanggalJatuhTempo,
        jenisNotifikasi: "PENGINGAT_HARI_JATUH_TEMPO",
        metodePengiriman,
      });
      
      createdNotifications.push(notification);
    }
  }
  
  // Buat notifikasi untuk transaksi yang sudah jatuh tempo tapi belum dibayar
  for (const transaction of overdueDueTransactions) {
    // Hitung angsuran ke berapa
    const angsuranKe = transaction.pembayaranKredit.length + 1;
    
    // Cek apakah notifikasi sudah ada
    const existingNotification = await prisma.kreditNotifikasi.findFirst({
      where: {
        kreditTransaksiId: transaction.id,
        angsuranKe,
        jenisNotifikasi: "PENGINGAT_SETELAH_JATUH_TEMPO",
      },
    });
    
    if (!existingNotification) {
      // Buat notifikasi baru
      const notification = await createKreditNotifikasi({
        kreditTransaksiId: transaction.id,
        pelangganId: transaction.transaksi.pelanggan_id,
        angsuranKe,
        jumlahTagihan: transaction.angsuranPerBulan,
        tanggalJatuhTempo: transaction.tanggalJatuhTempo,
        jenisNotifikasi: "PENGINGAT_SETELAH_JATUH_TEMPO",
        metodePengiriman,
      });
      
      createdNotifications.push(notification);
    }
  }
  
  return createdNotifications;
};

/**
 * Mengirim semua notifikasi kredit yang belum dikirim
 * @returns {Promise<Array>} - Daftar notifikasi yang dikirim
 */
const sendPendingNotifications = async () => {
  // Cari notifikasi yang belum dikirim
  const pendingNotifications = await prisma.kreditNotifikasi.findMany({
    where: {
      statusNotifikasi: "belum_dikirim",
    },
  });
  
  const sentNotifications = [];
  
  // Kirim notifikasi
  for (const notification of pendingNotifications) {
    try {
      const sentNotification = await sendKreditNotifikasi(notification.id);
      sentNotifications.push(sentNotification);
    } catch (error) {
      console.error(`Error sending notification ${notification.id}:`, error);
    }
  }
  
  return sentNotifications;
};

module.exports = {
  createKreditNotifikasi,
  sendKreditNotifikasi,
  getKreditNotifikasi,
  markNotifikasiRead,
  cancelKreditNotifikasi,
  createPaymentReminderNotifications,
  sendPendingNotifications,
};
