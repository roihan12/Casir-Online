const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern
} = require("../utils/redisUtils");
const { formatDecimal, formatObjectDecimals } = require("../utils/formatHelper");
const whatsappService = require("./whatsappService");

// Service untuk membuka shift baru
const openShift = async (data, auditInfo) => {
  const { cabangId, kasAwal, keterangan } = data;

  // Cek apakah cabang ada
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Cek apakah user sudah memiliki shift yang dibuka
  const activeShift = await prisma.shift.findFirst({
    where: {
      userId: auditInfo.userId,
      status: "dibuka",
    },
  });

  if (activeShift) {
    throw new ResponseError(400, "Kasir sudah memiliki shift yang aktif");
  }

  // Buat shift baru
  const shift = await prisma.shift.create({
    data: {
      userId: auditInfo.userId,
      cabangId,
      waktuMulai: new Date(),
      kasAwal,
      status: "dibuka",
      keterangan,
    },
    include: {
      user: {
        select: {
          id: true,
          namaLengkap: true,
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
      action: "OPEN_SHIFT",
      table_name: "shift",
      record_id: shift.id,
      new_values: JSON.stringify(shift),
    },
  });
  
  // Simpan ke cache
  const activeShiftKey = createCacheKey('active-shift', `${auditInfo.userId}:${cabangId}`);
  await cacheSet(activeShiftKey, shift, 3600); // Cache 1 jam

  // Format decimal fields
  const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
  const formattedShift = formatObjectDecimals(shift, monetaryFields);

  return formattedShift;
};

// Service untuk menutup shift
const closeShift = async (data, auditInfo) => {
  const { shiftId, kasAkhir, keterangan } = data;

  // Cek apakah shift ada dan masih dibuka
  const shift = await prisma.shift.findUnique({
    where: {
      id: shiftId,
    },
  });

  if (!shift) {
    throw new ResponseError(404, "Shift tidak ditemukan");
  }

  if (shift.status !== "dibuka") {
    throw new ResponseError(400, "Shift sudah ditutup");
  }

  // Pastikan user yang menutup shift adalah user yang membuka
  if (shift.userId !== auditInfo.userId) {
    // Alternatif: Cek apakah user memiliki hak akses untuk menutup shift orang lain
    const isAdmin = await isUserAdmin(auditInfo.userId);

    if (!isAdmin) {
      throw new ResponseError(403, "Tidak diizinkan menutup shift orang lain");
    }
  }

  // Hitung total transaksi dan pendapatan selama shift
  const transaksiData = await prisma.transaksi.aggregate({
    where: {
      shift_id: shiftId,
      status_pembayaran: "LUNAS",
    },
    _count: {
      transaksi_id: true,
    },
    _sum: {
      total: true,
    },
  });

  const totalTransaksi = transaksiData._count.transaksi_id || 0;
  const totalPendapatan = transaksiData._sum.total || 0;

  // Perhitungan selisih kas untuk log keterangan
  const expectedKasAkhir = Number(shift.kasAwal) + Number(totalPendapatan);
  const selisihKas = Number(kasAkhir) - expectedKasAkhir;

  const selisihKeterangan =
    selisihKas !== 0
      ? `Selisih kas: ${selisihKas > 0 ? "+" : ""}${selisihKas.toFixed(2)}`
      : "Kas sesuai";

  // Update shift untuk ditutup
  const updatedShift = await prisma.shift.update({
    where: {
      id: shiftId,
    },
    data: {
      waktuSelesai: new Date(),
      kasAkhir,
      totalTransaksi,
      totalPendapatan,
      status: "ditutup",
      keterangan: keterangan
        ? `${keterangan} | ${selisihKeterangan}`
        : selisihKeterangan,
    },
    include: {
      user: {
        select: {
          id: true,
          namaLengkap: true,
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
      action: "CLOSE_SHIFT",
      table_name: "shift",
      record_id: shiftId,
      old_values: JSON.stringify(shift),
      new_values: JSON.stringify(updatedShift),
    },
  });
  
  // Hapus cache shift aktif
  const activeShiftKey = createCacheKey('active-shift', `${shift.userId}:${shift.cabangId}`);
  await cacheDelete(activeShiftKey);

  // Send WhatsApp notification to Admin/Owner
  try {
      const botConfig = await prisma.botConfig.findFirst({
        where: { cabangId: shift.cabangId, isActive: true }
      });

      if (botConfig) {
          // Find all users with admin_cabang or super_admin role for this branch (simplified)
          // In a real system, you might have a specific notification settings table
          const admins = await prisma.user.findMany({
              where: {
                  cabangId: shift.cabangId,
                  roles: {
                      some: {
                          role: {
                              namaRole: { in: ['admin_cabang', 'super_admin'] }
                          }
                      }
                  }
              }
          });

          if (admins.length > 0) {
              const wService = new whatsappService();
              
              const formatCur = (amount) => new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR", minimumFractionDigits: 0}).format(amount);
              
              const reportMsg = `📊 *LAPORAN TUTUP SHIFT* 📊\n\n` +
                 `Cabang: *${updatedShift.cabang.namaCabang}*\n` +
                 `Kasir: *${updatedShift.user.namaLengkap}*\n` +
                 `Waktu Buka: ${new Date(shift.waktuMulai).toLocaleTimeString('id-ID')}\n` +
                 `Waktu Tutup: ${new Date(updatedShift.waktuSelesai).toLocaleTimeString('id-ID')}\n\n` +
                 `Total Transaksi: *${totalTransaksi}*\n` +
                 `Total Pendapatan: *${formatCur(totalPendapatan)}*\n` +
                 `Kas Awal: *${formatCur(shift.kasAwal)}*\n` +
                 `Kas Akhir (Fisik): *${formatCur(kasAkhir)}*\n` +
                 `Status: *${selisihKas === 0 ? 'Sesuai ✅' : (selisihKas > 0 ? 'Lebih ⚠️ (+'+formatCur(selisihKas)+')' : 'Kurang ❌ ('+formatCur(selisihKas)+')')}*\n\n` +
                 `Catatan:\n_${keterangan || '-'}_`;

              for (const admin of admins) {
                  if (admin.telepon || admin.noHp) {
                      let phone = admin.telepon || admin.noHp;
                      let formattedPhone = phone.replace(/[^0-9]/g, '');
                      if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
                      if (!formattedPhone.endsWith('@s.whatsapp.net')) formattedPhone += '@s.whatsapp.net';

                      await wService.sendMessage(formattedPhone, reportMsg, botConfig.deviceId);
                  }
              }
          }
      }
  } catch (err) {
      console.error("[ShiftWA] Failed to send shift closure report:", err.message);
  }
  
  // Cache shift detail (masih bermanfaat untuk laporan)
  const shiftDetailKey = createCacheKey('shift', shiftId);
  await cacheSet(shiftDetailKey, {
    ...updatedShift,
    summary: {
      expectedKasAkhir,
      selisihKas,
      totalTransaksi,
      totalPendapatan,
    },
  }, 86400); // Cache 1 hari
  
  // Invalidasi cache daftar shift
  await cacheDeletePattern('shifts:*');

  // Format decimal fields
  const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
  const formattedShift = formatObjectDecimals(updatedShift, monetaryFields);

  // Format summary values
  const formattedSummary = {
    expectedKasAkhir: formatDecimal(expectedKasAkhir),
    selisihKas: formatDecimal(selisihKas),
    totalTransaksi,
    totalPendapatan: formatDecimal(totalPendapatan),
  };

  return {
    ...formattedShift,
    summary: formattedSummary,
  };
};

// Service untuk menyesuaikan shift (jika ada selisih kas)
const adjustShift = async (data, auditInfo) => {
  const { shiftId, kasAkhir, alasanPenyesuaian, selisih, keterangan } = data;

  // Cek apakah shift ada
  const shift = await prisma.shift.findUnique({
    where: {
      id: shiftId,
    },
  });

  if (!shift) {
    throw new ResponseError(404, "Shift tidak ditemukan");
  }

  if (shift.status === "dibuka") {
    throw new ResponseError(400, "Shift masih dibuka, tidak dapat disesuaikan");
  }

  // Cek apakah user memiliki hak akses untuk menyesuaikan shift
  const isAdmin = await isUserAdmin(auditInfo.userId);

  if (!isAdmin) {
    throw new ResponseError(403, "Tidak diizinkan menyesuaikan shift");
  }

  // Update shift
  const updatedShift = await prisma.shift.update({
    where: {
      id: shiftId,
    },
    data: {
      kasAkhir,
      status: "disesuaikan",
      keterangan: `${
        shift.keterangan || ""
      } | Penyesuaian: ${alasanPenyesuaian} | Selisih: ${
        selisih > 0 ? "+" : ""
      }${selisih.toFixed(2)} | ${keterangan || ""}`,
    },
    include: {
      user: {
        select: {
          id: true,
          namaLengkap: true,
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
      action: "ADJUST_SHIFT",
      table_name: "shift",
      record_id: shiftId,
      old_values: JSON.stringify(shift),
      new_values: JSON.stringify(updatedShift),
    },
  });
  
  // Update cache shift detail
  const shiftDetailKey = createCacheKey('shift', shiftId);
  await cacheSet(shiftDetailKey, updatedShift, 86400); // Cache 1 hari
  
  // Invalidasi cache daftar shift dan laporan
  await cacheDeletePattern('shifts:*');
  await cacheDeletePattern('shift-report:*');
  
  // Format decimal fields
  const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
  const formattedShift = formatObjectDecimals(updatedShift, monetaryFields);

  return formattedShift;
};

// Service untuk mendapatkan shift aktif milik kasir
const getActiveShift = async (userId) => {
  const cacheKey = createCacheKey('active-shift', userId);
  
  return await cacheOrFetch(cacheKey, async () => {
    // Cek apakah user memiliki shift yang dibuka
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        status: "dibuka",
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
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

    if (!activeShift) {
      return null;
    }

    // Hitung total transaksi dan pendapatan sementara
    const transaksiData = await prisma.transaksi.aggregate({
      where: {
        shift_id: activeShift.id,
        status_pembayaran: "LUNAS",
      },
      _count: {
        transaksi_id: true,
      },
      _sum: {
        total: true,
      },
    });

    const totalTransaksi = transaksiData._count.transaksi_id || 0;
    const totalPendapatan = transaksiData._sum.total || 0;

    // Format decimal fields
    const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
    const formattedShift = formatObjectDecimals(activeShift, monetaryFields);

    return {
      ...formattedShift,
      currentStats: {
        totalTransaksi,
        totalPendapatan: formatDecimal(totalPendapatan),
        expectedKasAkhir: formatDecimal(Number(activeShift.kasAwal) + Number(totalPendapatan)),
      },
    };
  }, 60); // Cache hanya 1 menit karena data mungkin berubah sering
};

// Service untuk mendapatkan detail shift
const getShiftById = async (shiftId) => {
  const cacheKey = createCacheKey('shift', shiftId);
  
  return await cacheOrFetch(cacheKey, async () => {
    const shift = await prisma.shift.findUnique({
      where: {
        id: shiftId,
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        transaksi: {
          where: {
            status_pembayaran: "LUNAS",
          },
          include: {
            pembayaran: true,
          },
        },
      },
    });

    if (!shift) {
      throw new ResponseError(404, "Shift tidak ditemukan");
    }

    console.log("shift", shift);

    // Hitung total berdasarkan metode pembayaran
    const paymentSummary = {};

    shift.transaksi.forEach((transaksi) => {
      transaksi.pembayaran.forEach((pembayaran) => {
        if (pembayaran.status === "SUKSES") {
          const metode = pembayaran.metode_pembayaran;
          if (!paymentSummary[metode]) {
            paymentSummary[metode] = 0;
          }
          paymentSummary[metode] +=
            Number(pembayaran.jumlah_bayar) - Number(pembayaran.jumlah_kembali);
        }
      });
    });

    // Format decimal fields
    const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
    const formattedShift = formatObjectDecimals(shift, monetaryFields);

    return {
      ...formattedShift,
      paymentSummary,
      totalTransaksi: shift.transaksi.length,
      totalPendapatan: formatDecimal(shift.transaksi.reduce(
        (sum, t) => sum + Number(t.total),
        0
      )),
    };
  }, 300); // Cache 1 jam
};

// Service untuk mendapatkan daftar shift
const getShifts = async (filters) => {
  const {
    cabangId,
    userId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 10,
  } = filters;

  // Buat cache key berdasarkan filter
  const cacheKey = createCacheKey(
    "shifts",
    `cabang:${cabangId || "-"}-user:${userId || "-"}-start:${
      startDate || "-"
    }-end:${endDate || "-"}-status:${status || "-"}-page:${page}-limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      // Buat kondisi filter
      const where = {};

      if (cabangId) where.cabangId = cabangId;
      if (userId) where.userId = userId;
      if (status) where.status = status;

      if (startDate || endDate) {
        where.waktuMulai = {};
        if (startDate) where.waktuMulai.gte = new Date(startDate);
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          where.waktuMulai.lte = endDateObj;
        }
      }

      // Hitung total
      const totalCount = await prisma.shift.count({ where });

      // Ambil data dengan paginasi
      const shifts = await prisma.shift.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
          _count: {
            select: {
              transaksi: true,
            },
          },
        },
        orderBy: {
          waktuMulai: "desc",
        },
        skip,
        take: limit,
      });

      // Hitung total halaman
      const totalPages = Math.ceil(totalCount / limit);

      // Format decimal fields for all shifts
      const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
      const formattedShifts = shifts.map(shift => formatObjectDecimals(shift, monetaryFields));

      return {
        data: formattedShifts,
        pagination: {
          totalItems: totalCount,
          totalPages,
          page: parseInt(page),
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    300
  ); // Cache 5 menit
};

// Service untuk mendapatkan laporan shift
const getShiftReport = async (filters) => {
  const { 
    cabangId, 
    startDate, 
    endDate, 
    status, 
    search, 
    page = 1, 
    limit = 10 
  } = filters;

  // Buat cache key berdasarkan filter
  const cacheKey = createCacheKey(
    "shift-report",
    `cabang:${cabangId}-start:${startDate || "-"}-end:${endDate || "-"}-status:${status || "-"}-search:${search || "-"}-page:${page}-limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Validasi input
      if (!cabangId) {
        throw new ResponseError(400, "cabangId diperlukan");
      }

      const where = { cabangId };

      // Filter tanggal
      if (startDate || endDate) {
        where.waktuMulai = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          where.waktuMulai.gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.waktuMulai.lte = end;
        }
      }

      // Filter status
      if (status) {
        where.status = status;
      }

      // Filter pencarian (Nama Kasir)
      if (search) {
        where.user = {
          namaLengkap: {
            contains: search,
            mode: "insensitive",
          },
        };
      }

      // Ambil SEMUA data shift untuk ringkasan (tanpa paginasi)
      const allMatchingShifts = await prisma.shift.findMany({
        where,
        select: {
          kasAwal: true,
          kasAkhir: true,
          totalPendapatan: true,
          totalTransaksi: true,
          status: true,
        }
      });

      // Hitung ringkasan
      const summary = {
        totalShifts: allMatchingShifts.length,
        totalRevenue: allMatchingShifts.reduce((sum, s) => sum + Number(s.totalPendapatan || 0), 0),
        totalTransactions: allMatchingShifts.reduce((sum, s) => sum + (s.totalTransaksi || 0), 0),
        statusBreakdown: {
          dibuka: allMatchingShifts.filter(s => s.status === "dibuka").length,
          ditutup: allMatchingShifts.filter(s => s.status === "ditutup").length,
          disesuaikan: allMatchingShifts.filter(s => s.status === "disesuaikan").length,
        }
      };

      // Ambil data shift dengan paginasi untuk tabel
      const skip = (page - 1) * limit;
      const shifts = await prisma.shift.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
        orderBy: {
          waktuMulai: "desc",
        },
        skip,
        take: limit,
      });

      const totalCount = summary.totalShifts;
      const totalPages = Math.ceil(totalCount / limit);

      // Format decimal fields for all shifts
      const monetaryFields = ['kasAwal', 'kasAkhir', 'totalPendapatan', 'selisih'];
      const formattedShifts = shifts.map(shift => formatObjectDecimals(shift, monetaryFields));

      // Format summary values
      const formattedSummary = {
        ...summary,
        totalRevenue: formatDecimal(summary.totalRevenue),
      };

      return {
        data: formattedShifts,
        meta: {
          totalItems: totalCount,
          totalPages,
          page: page,
          limit: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        summary: formattedSummary
      };
    },
    300
  ); // Cache 5 menit
};

// Helper untuk mengecek apakah user adalah admin
const isUserAdmin = async (userId) => {
  const cacheKey = createCacheKey("user-admin-check", userId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Cek role user
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
        },
        include: {
          role: true,
        },
      });

      // Cek apakah user memiliki role admin_cabang atau super_admin
      return userRoles.some(
        (ur) =>
          ur.role.namaRole === "admin_cabang" ||
          ur.role.namaRole === "super_admin"
      );
    },
    3600
  ); // Cache 1 jam
};

// Fungsi untuk invalidasi cache shift
const invalidateShiftCache = async (
  shiftId = null,
  userId = null,
  cabangId = null
) => {
  if (shiftId) {
    await cacheDelete(createCacheKey("shift", shiftId));
  }

  if (userId && cabangId) {
    await cacheDelete(createCacheKey("active-shift", `${userId}:${cabangId}`));
  } else if (userId) {
    await cacheDelete(createCacheKey("active-shift", userId));
    await cacheDelete(createCacheKey("user-admin-check", userId));
  }

  if (cabangId) {
    await cacheDelete(`shift-report:cabang:${cabangId}*`);
  }

  // Invalidasi semua cache daftar shifts
  await cacheDeletePattern("shifts:*");
};

module.exports = {
  openShift,
  closeShift,
  adjustShift,
  getActiveShift,
  getShiftById,
  getShifts,
  getShiftReport,
  invalidateShiftCache,
};