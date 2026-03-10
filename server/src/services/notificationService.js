const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const nodemailer = require("nodemailer"); // Untuk pengiriman email
const ejs = require("ejs");
const path = require("path");
const { logger } = require("../utils/logger");


// Mendapatkan atau membuat konfigurasi notifikasi untuk cabang
const getOrCreateNotificationConfig = async (cabangId) => {
  // Cek apakah cabang ada
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Cari konfigurasi notifikasi yang ada
  let config = await prisma.notificationConfig.findFirst({
    where: { cabangId },
  });

  // Jika tidak ada, buat konfigurasi default
  if (!config) {
    config = await prisma.notificationConfig.create({
      data: {
        cabangId,
        lowStockThresholdDays: 7,
        expiryThresholdDays: 30,
        enableEmailNotification: true,
        enableAppNotification: true,
      },
    });
  }

  return config;
};

// Update konfigurasi notifikasi
const updateNotificationConfig = async (data, auditInfo) => {
  const {
    cabangId,
    lowStockThresholdDays,
    expiryThresholdDays,
    enableEmailNotification,
    enableAppNotification,
    emailRecipients,
  } = data;

  // Cek apakah cabang ada
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Cari konfigurasi yang ada atau buat baru
  let config = await prisma.notificationConfig.findFirst({
    where: { cabangId },
  });

  const oldConfig = { ...config };

  // Update atau buat konfigurasi
  if (config) {
    config = await prisma.notificationConfig.update({
      where: { id: config.id },
      data: {
        lowStockThresholdDays:
          lowStockThresholdDays !== undefined
            ? lowStockThresholdDays
            : config.lowStockThresholdDays,
        expiryThresholdDays:
          expiryThresholdDays !== undefined
            ? expiryThresholdDays
            : config.expiryThresholdDays,
        enableEmailNotification:
          enableEmailNotification !== undefined
            ? enableEmailNotification
            : config.enableEmailNotification,
        enableAppNotification:
          enableAppNotification !== undefined
            ? enableAppNotification
            : config.enableAppNotification,
        emailRecipients:
          emailRecipients !== undefined
            ? emailRecipients
            : config.emailRecipients,
      },
    });
  } else {
    config = await prisma.notificationConfig.create({
      data: {
        cabangId,
        lowStockThresholdDays: lowStockThresholdDays || 7,
        expiryThresholdDays: expiryThresholdDays || 30,
        enableEmailNotification:
          enableEmailNotification !== undefined
            ? enableEmailNotification
            : true,
        enableAppNotification:
          enableAppNotification !== undefined ? enableAppNotification : true,
        emailRecipients,
      },
    });
  }

  // Tambahkan log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: oldConfig
        ? "UPDATE_NOTIFICATION_CONFIG"
        : "CREATE_NOTIFICATION_CONFIG",
      table_name: "notification_config",
      record_id: config.id,
      old_values: oldConfig ? JSON.stringify(oldConfig) : null,
      new_values: JSON.stringify(config),
    },
  });

  return config;
};

// Membuat notifikasi stok
const createStockNotification = async (data) => {
  const { configId, produkId, cabangId, type, message, details } = data;

  // Cek apakah produk ada
  const produk = await prisma.produk.findUnique({
    where: { id: produkId },
    include: {
      produkMaster: true,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan");
  }

  // Cek apakah ada notifikasi serupa yang belum dibaca
  const existingNotification = await prisma.stockNotification.findFirst({
    where: {
      produkId,
      cabangId,
      type,
      isRead: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Jika sudah ada notifikasi serupa yang belum dibaca dan dibuat dalam 24 jam terakhir,
  // tidak perlu membuat notifikasi baru
  if (existingNotification) {
    const hoursSinceLastNotification =
      (Date.now() - existingNotification.createdAt) / (1000 * 60 * 60);
    if (hoursSinceLastNotification < 24) {
      return existingNotification;
    }
  }

  // Buat notifikasi baru
  const notification = await prisma.stockNotification.create({
    data: {
      configId,
      produkId,
      cabangId,
      type,
      message,
      details,
      isRead: false,
    },
  });

  // Dapatkan konfigurasi notifikasi
  const config = await prisma.notificationConfig.findUnique({
    where: { id: configId },
  });

  // Kirim notifikasi email jika diaktifkan
  if (config.enableEmailNotification && config.emailRecipients) {
    await sendEmailNotification(notification, produk, config);
  }

  return notification;
};

// Mengirim notifikasi email
const sendEmailNotification = async (notification, produk, config) => {
  // Ini hanya implementasi dasar, pada aplikasi sebenarnya
  // Anda akan menggunakan SMTP konfigurasi dari environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user@example.com",
      pass: process.env.SMTP_PASS || "password",
    },
  });

  const recipients = config.emailRecipients.split(",");

  // Buat konten email
  const subject = `Stock Alert: ${notification.type} for ${produk.produkMaster.namaProduk}`;
  const html = `
    <h2>Stock Notification Alert</h2>
    <p><strong>Product:</strong> ${produk.produkMaster.namaProduk}</p>
    <p><strong>Type:</strong> ${notification.type}</p>
    <p><strong>Message:</strong> ${notification.message}</p>
    ${
      notification.details
        ? `<p><strong>Details:</strong> ${notification.details}</p>`
        : ""
    }
    <p><strong>Date:</strong> ${notification.createdAt.toLocaleString()}</p>
    <p><a href="${
      process.env.APP_URL || "https://pos.example.com"
    }/inventory/product/${produk.id}">View Product</a></p>
  `;

  try {
    // Kirim email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"POS System" <pos@example.com>',
      to: recipients.join(","),
      subject,
      html,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send email notification:", error);
    return false;
  }
};

// Mendapatkan daftar notifikasi
const getNotifications = async (filters) => {
  const { cabangId, type, isRead, page = 1, limit = 10 } = filters;

  const skip = (page - 1) * limit;

  // Buat kondisi filter
  const where = {};
  if (cabangId) where.cabangId = cabangId;
  if (type) where.type = type;
  if (isRead !== undefined) where.isRead = isRead;

  // Hitung total record
  const totalCount = await prisma.stockNotification.count({ where });

  // Ambil data dengan paginasi
  const notifications = await prisma.stockNotification.findMany({
    where,
    include: {
      produk: {
        include: {
          produkMaster: true,
        },
      },
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  // Hitung total halaman
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: notifications,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Menandai notifikasi telah dibaca
const markNotificationRead = async (notificationId, auditInfo) => {
  // Cek apakah notifikasi ada
  const notification = await prisma.stockNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new ResponseError(404, "Notifikasi tidak ditemukan");
  }

  // Update notifikasi
  const updatedNotification = await prisma.stockNotification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: {
      produk: {
        include: {
          produkMaster: true,
        },
      },
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
  });

  // Tambahkan log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "MARK_NOTIFICATION_READ",
      table_name: "stock_notification",
      record_id: notificationId,
      old_values: JSON.stringify({
        isRead: notification.isRead,
        readAt: notification.readAt,
      }),
      new_values: JSON.stringify({
        isRead: true,
        readAt: updatedNotification.readAt,
      }),
    },
  });

  return updatedNotification;
};

// Mengirim notifikasi stok secara manual
const sendManualNotification = async (data, auditInfo) => {
  const { cabangId, produkId, type, message, details } = data;

  // Cek apakah produk ada
  const produk = await prisma.produk.findFirst({
    where: {
      id: produkId,
      cabangId,
    },
    include: {
      produkMaster: true,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan di cabang ini");
  }

  // Dapatkan konfigurasi notifikasi
  const config = await getOrCreateNotificationConfig(cabangId);

  // Buat notifikasi
  const notification = await createStockNotification({
    configId: config.id,
    produkId,
    cabangId,
    type,
    message,
    details,
  });

  // Tambahkan log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "SEND_MANUAL_NOTIFICATION",
      table_name: "stock_notification",
      record_id: notification.id,
      new_values: JSON.stringify(notification),
    },
  });

  return notification;
};

// Memeriksa stok yang rendah dan membuat notifikasi
const checkLowStock = async () => {
  // Dapatkan semua cabang dengan konfigurasi notifikasi
  const configs = await prisma.notificationConfig.findMany({
    include: {
      cabang: true,
    },
  });

  const notifications = [];

  // Periksa setiap cabang
  for (const config of configs) {
    // Hanya lanjutkan jika notifikasi aplikasi diaktifkan
    if (!config.enableAppNotification) continue;

    // Dapatkan produk dengan stok rendah
    const lowStockProducts = await prisma.produk.findMany({
      where: {
        cabangId: config.cabangId,
        minStok: {
          not: null,
        },
        stok: {
          lte: prisma.produk.fields.minStok,
        },
      },
      include: {
        produkMaster: true,
      },
    });

    // Buat notifikasi untuk setiap produk stok rendah
    for (const produk of lowStockProducts) {
      const notification = await createStockNotification({
        configId: config.id,
        produkId: produk.id,
        cabangId: config.cabangId,
        type: "LOW_STOCK",
        message: `Stok ${produk.produkMaster.namaProduk} di bawah minimum (${produk.stok}/${produk.minStok})`,
        details: `Current stock is ${produk.stok}, minimum required is ${produk.minStok}`,
      });

      notifications.push(notification);
    }
  }

  return notifications;
};

// Memeriksa stok yang akan kadaluarsa dan membuat notifikasi
const checkExpiringStock = async () => {
  // Dapatkan semua cabang dengan konfigurasi notifikasi
  const configs = await prisma.notificationConfig.findMany({
    include: {
      cabang: true,
    },
  });

  const notifications = [];

  // Periksa setiap cabang
  for (const config of configs) {
    // Hanya lanjutkan jika notifikasi aplikasi diaktifkan
    if (!config.enableAppNotification) continue;

    // Hitung tanggal ambang batas
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + config.expiryThresholdDays);

    // Dapatkan pergerakan stok dengan tanggal kadaluarsa mendekati
    const expiringMovements = await prisma.inventoryMovement.findMany({
      where: {
        cabangId: config.cabangId,
        expiredDate: {
          not: null,
          lte: thresholdDate,
          gt: new Date(), // Hanya yang belum kadaluarsa
        },
        batchNumber: {
          not: null,
        },
      },
      include: {
        produk: {
          include: {
            produkMaster: true,
          },
        },
      },
      orderBy: {
        expiredDate: "asc",
      },
      distinct: ["batchNumber", "produkId"],
    });

    // Buat notifikasi untuk setiap batch yang akan kadaluarsa
    for (const movement of expiringMovements) {
      const today = new Date();
      const expiry = new Date(movement.expiredDate);
      const diffTime = Math.abs(expiry - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const notification = await createStockNotification({
        configId: config.id,
        produkId: movement.produkId,
        cabangId: config.cabangId,
        type: "EXPIRING_STOCK",
        message: `Batch ${movement.batchNumber} dari ${movement.produk.produkMaster.namaProduk} akan kadaluarsa dalam ${diffDays} hari`,
        details: `Expiry date: ${movement.expiredDate.toLocaleDateString()}, Batch: ${
          movement.batchNumber
        }`,
      });

      notifications.push(notification);
    }
  }

  return notifications;
};

// Mendapatkan statistik notifikasi
const getNotificationStats = async (filters) => {
  const { cabangId, startDate, endDate } = filters;
  
  // Buat kondisi filter
  const where = {};
  if (cabangId) where.cabangId = cabangId;
  
  // Filter berdasarkan tanggal
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      where.createdAt.lte = end;
    }
  }

  // Hitung total notifikasi
  const totalCount = await prisma.stockNotification.count({ where });
  
  // Hitung notifikasi yang belum dibaca
  const unreadCount = await prisma.stockNotification.count({
    where: {
      ...where,
      isRead: false,
    },
  });
  
  // Hitung berdasarkan tipe notifikasi
  const byTypeCount = await prisma.stockNotification.groupBy({
    by: ['type'],
    where,
    _count: {
      id: true,
    },
  });
  
  // Format hasil pengelompokan berdasarkan tipe
  const typeStats = {};
  byTypeCount.forEach(item => {
    typeStats[item.type] = item._count.id;
  });
  
  // Hitung berdasarkan cabang jika tidak ada filter cabang
  let branchStats = {};
  if (!cabangId) {
    const byBranchCount = await prisma.stockNotification.groupBy({
      by: ['cabangId'],
      where,
      _count: {
        id: true,
      },
    });
    
    // Dapatkan informasi cabang
    const branchIds = byBranchCount.map(item => item.cabangId);
    const branches = await prisma.cabang.findMany({
      where: {
        id: {
          in: branchIds,
        },
      },
      select: {
        id: true,
        namaCabang: true,
      },
    });
    
    // Format hasil pengelompokan berdasarkan cabang
    const branchMap = {};
    branches.forEach(branch => {
      branchMap[branch.id] = branch.namaCabang;
    });
    
    byBranchCount.forEach(item => {
      branchStats[branchMap[item.cabangId] || item.cabangId] = item._count.id;
    });
  }
  
  // Dapatkan tren notifikasi harian dalam rentang waktu
  let dailyTrend = [];
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Buat array tanggal dalam rentang
    const dateArray = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Dapatkan data untuk setiap tanggal
    for (const date of dateArray) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayCount = await prisma.stockNotification.count({
        where: {
          ...where,
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      
      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        count: dayCount,
      });
    }
  }
  
  // Hitung rata-rata waktu respons (dari dibuat hingga dibaca)
  let avgResponseTime = null;
  const notificationsWithReadTime = await prisma.stockNotification.findMany({
    where: {
      ...where,
      isRead: true,
      readAt: {
        not: null,
      },
    },
    select: {
      createdAt: true,
      readAt: true,
    },
  });
  
  if (notificationsWithReadTime.length > 0) {
    const totalResponseTimeMs = notificationsWithReadTime.reduce((total, notification) => {
      return total + (notification.readAt.getTime() - notification.createdAt.getTime());
    }, 0);
    
    // Konversi ke jam
    avgResponseTime = (totalResponseTimeMs / notificationsWithReadTime.length) / (1000 * 60 * 60);
  }
  
  return {
    totalNotifications: totalCount,
    unreadNotifications: unreadCount,
    readRate: totalCount > 0 ? ((totalCount - unreadCount) / totalCount) * 100 : 0,
    byType: typeStats,
    byBranch: branchStats,
    dailyTrend,
    avgResponseTimeHours: avgResponseTime,
  };
};

// Send stock transfer request notification to admins
const sendStockTransferRequestNotification = async (transfer) => {
  try {
    // Get all users with permission to approve stock transfers
    const admins = await prisma.userRole.findMany({
      where: {
        role: {
          permissions: {
            hasSome: ['stock_transfer:approve', 'stock_transfer:write'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    if (admins.length === 0) {
      logger.info('No admins found with stock transfer approval permission');
      return { success: false, message: 'No admins to notify' };
    }

    // Get recipient emails
    const recipients = admins
      .map((admin) => admin.user.email)
      .filter((email) => email);

    if (recipients.length === 0) {
      logger.info('No email addresses found for admins');
      return { success: false, message: 'No email addresses found' };
    }

    // Prepare template data
    const templateData = {
      transfer: {
        ...transfer,
        cabangAsal: await prisma.cabang.findUnique({
          where: { id: transfer.cabangAsalId },
          select: { namaCabang: true },
        }),
        cabangTujuan: await prisma.cabang.findUnique({
          where: { id: transfer.cabangTujuanId },
          select: { namaCabang: true },
        }),
        items: await prisma.stockTransferItem.findMany({
          where: { stockTransferId: transfer.id },
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        }),
      },
      language: 'id',
      companyName: 'Casir Online POS',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    };

    // Render email template
    const templatePath = path.join(__dirname, '../../templates/emails/stock_transfer_request.ejs');
    const html = await ejs.renderFile(templatePath, templateData);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Casir Online POS" <noreply@casir-online.com>',
      to: recipients.join(','),
      subject: `Stock Transfer Request - ${templateData.transfer.nomorTransfer}`,
      html,
    });

    return { success: true, recipients: recipients.length };
  } catch (error) {
    logger.error('Error sending stock transfer request notification:', error);
    return { success: false, error: error.message };
  }
};

// Send stock transfer approved notification to source branch
const sendStockTransferApprovedNotification = async (transfer) => {
  try {
    // Get users from source branch who should be notified
    const branchUsers = await prisma.userRole.findMany({
      where: {
        cabangId: transfer.cabangAsalId,
        role: {
          permissions: {
            hasSome: ['stock_transfer:read', 'stock_transfer:write'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    // Also get admins
    const admins = await prisma.userRole.findMany({
      where: {
        role: {
          permissions: {
            hasSome: ['stock_transfer:approve'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    const allRecipients = [...branchUsers, ...admins];
    const recipients = allRecipients
      .map((r) => r.user.email)
      .filter((email) => email);

    if (recipients.length === 0) {
      logger.info('No recipients found for approved notification');
      return { success: false, message: 'No recipients found' };
    }

    // Get approved by user
    let approvedBy = null;
    if (transfer.approvedById) {
      approvedBy = await prisma.user.findUnique({
        where: { id: transfer.approvedById },
        select: { namaLengkap: true },
      });
    }

    // Prepare template data
    const templateData = {
      transfer: {
        ...transfer,
        approvedBy,
        cabangAsal: await prisma.cabang.findUnique({
          where: { id: transfer.cabangAsalId },
          select: { namaCabang: true },
        }),
        cabangTujuan: await prisma.cabang.findUnique({
          where: { id: transfer.cabangTujuanId },
          select: { namaCabang: true },
        }),
        items: await prisma.stockTransferItem.findMany({
          where: { stockTransferId: transfer.id },
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        }),
      },
      language: 'id',
      companyName: 'Casir Online POS',
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    };

    // Render email template
    const templatePath = path.join(__dirname, '../../templates/emails/stock_transfer_approved.ejs');
    const html = await ejs.renderFile(templatePath, templateData);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Casir Online POS" <noreply@casir-online.com>',
      to: recipients.join(','),
      subject: `Stock Transfer Approved - ${templateData.transfer.nomorTransfer}`,
      html,
    });

    return { success: true, recipients: recipients.length };
  } catch (error) {
    logger.error('Error sending stock transfer approved notification:', error);
    return { success: false, error: error.message };
  }
};

// Send stock transfer rejected notification to source branch
const sendStockTransferRejectedNotification = async (transfer) => {
  try {
    // Get users from source branch who should be notified
    const branchUsers = await prisma.userRole.findMany({
      where: {
        cabangId: transfer.cabangAsalId,
        role: {
          permissions: {
            hasSome: ['stock_transfer:read', 'stock_transfer:write'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    // Also get admins
    const admins = await prisma.userRole.findMany({
      where: {
        role: {
          permissions: {
            hasSome: ['stock_transfer:approve'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    const allRecipients = [...branchUsers, ...admins];
    const recipients = allRecipients
      .map((r) => r.user.email)
      .filter((email) => email);

    if (recipients.length === 0) {
      logger.info('No recipients found for rejected notification');
      return { success: false, message: 'No recipients found' };
    }

    // Get rejected by user
    let rejectedBy = null;
    if (transfer.rejectedById) {
      rejectedBy = await prisma.user.findUnique({
        where: { id: transfer.rejectedById },
        select: { namaLengkap: true },
      });
    }

    // Prepare template data
    const templateData = {
      transfer: {
        ...transfer,
        rejectedBy,
        cabangAsal: await prisma.cabang.findUnique({
          where: { id: transfer.cabangAsalId },
          select: { namaCabang: true },
        }),
        cabangTujuan: await prisma.cabang.findUnique({
          where: { id: transfer.cabangTujuanId },
          select: { namaCabang: true },
        }),
        items: await prisma.stockTransferItem.findMany({
          where: { stockTransferId: transfer.id },
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        }),
      },
      language: 'id',
      companyName: 'Casir Online POS',
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    };

    // Render email template
    const templatePath = path.join(__dirname, '../../templates/emails/stock_transfer_rejected.ejs');
    const html = await ejs.renderFile(templatePath, templateData);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Casir Online POS" <noreply@casir-online.com>',
      to: recipients.join(','),
      subject: `Stock Transfer Rejected - ${templateData.transfer.nomorTransfer}`,
      html,
    });

    return { success: true, recipients: recipients.length };
  } catch (error) {
    logger.error('Error sending stock transfer rejected notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getOrCreateNotificationConfig,
  updateNotificationConfig,
  createStockNotification,
  getNotifications,
  markNotificationRead,
  sendManualNotification,
  checkLowStock,
  checkExpiringStock,
  getNotificationStats,
  sendStockTransferRequestNotification,
  sendStockTransferApprovedNotification,
  sendStockTransferRejectedNotification,
};
