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
  
  return shift;
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
  
  return {
    ...updatedShift,
    summary: {
      expectedKasAkhir,
      selisihKas,
      totalTransaksi,
      totalPendapatan,
    },
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
  
  return updatedShift;
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

    return {
      ...activeShift,
      currentStats: {
        totalTransaksi,
        totalPendapatan,
        expectedKasAkhir: Number(activeShift.kasAwal) + Number(totalPendapatan),
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

    return {
      ...shift,
      paymentSummary,
      totalTransaksi: shift.transaksi.length,
      totalPendapatan: shift.transaksi.reduce(
        (sum, t) => sum + Number(t.total),
        0
      ),
    };
  }, 3600); // Cache 1 jam
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

      return {
        data: shifts,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
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
  const { cabangId, startDate, endDate } = filters;

  // Buat cache key berdasarkan filter
  const cacheKey = createCacheKey(
    "shift-report",
    `cabang:${cabangId}-start:${startDate}-end:${endDate}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Validasi input
      if (!cabangId) {
        throw new ResponseError(400, "cabangId diperlukan");
      }

      if (!startDate || !endDate) {
        throw new ResponseError(400, "startDate dan endDate diperlukan");
      }

      // Parse tanggal
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Ambil data shift dalam periode
      const shifts = await prisma.shift.findMany({
        where: {
          cabangId,
          waktuMulai: {
            gte: start,
            lte: end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
          _count: {
            select: {
              transaksi: true,
            },
          },
        },
        orderBy: {
          waktuMulai: "asc",
        },
      });

      // Hitung ringkasan
      const totalShifts = shifts.length;
      const openedShifts = shifts.filter((s) => s.status === "dibuka").length;
      const closedShifts = shifts.filter((s) => s.status === "ditutup").length;
      const adjustedShifts = shifts.filter(
        (s) => s.status === "disesuaikan"
      ).length;

      let totalCashIn = 0;
      let totalCashOut = 0;
      let totalRevenue = 0;
      let totalTransactions = 0;

      shifts.forEach((shift) => {
        if (shift.kasAwal) totalCashIn += Number(shift.kasAwal);
        if (shift.kasAkhir) totalCashOut += Number(shift.kasAkhir);
        if (shift.totalPendapatan)
          totalRevenue += Number(shift.totalPendapatan);
        if (shift.totalTransaksi) totalTransactions += shift.totalTransaksi;
      });

      // Ringkasan per kasir
      const userSummary = {};
      shifts.forEach((shift) => {
        const userId = shift.user.id;
        const userName = shift.user.namaLengkap;

        if (!userSummary[userId]) {
          userSummary[userId] = {
            userId,
            userName,
            totalShifts: 0,
            totalRevenue: 0,
            totalTransactions: 0,
          };
        }

        userSummary[userId].totalShifts += 1;
        if (shift.totalPendapatan)
          userSummary[userId].totalRevenue += Number(shift.totalPendapatan);
        if (shift.totalTransaksi)
          userSummary[userId].totalTransactions += shift.totalTransaksi;
      });

      return {
        period: {
          startDate: start,
          endDate: end,
        },
        summary: {
          totalShifts,
          openedShifts,
          closedShifts,
          adjustedShifts,
          totalCashIn,
          totalCashOut,
          totalRevenue,
          totalTransactions,
          cashDifference: totalCashOut - (totalCashIn + totalRevenue),
        },
        userSummary: Object.values(userSummary),
        shifts,
      };
    },
    1800
  ); // Cache 30 menit untuk laporan
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