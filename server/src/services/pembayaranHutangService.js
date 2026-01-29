const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");
const { invalidateTransaksiCache } = require("./transaksiService");

/**
 * Create pembayaran hutang (debt payment)
 * Handles both partial payment (cicilan) and full payment (pelunasan)
 */
const createPembayaranHutang = async (data, auditInfo) => {
  const { hutang_id, jumlah_bayar, metode_pembayaran, nomor_referensi, keterangan, bukti_url } = data;

  try {
    // Validate hutang exists and is active
    const hutang = await prisma.hutang.findUnique({
      where: { id: hutang_id },
      include: {
        pelanggan: true,
        supplier: true,
        transaksi: true,
        cabang: true,
      },
    });

    if (!hutang) {
      throw new ResponseError(404, "Hutang tidak ditemukan");
    }

    if (hutang.statusHutang === "lunas") {
      throw new ResponseError(400, "Hutang sudah lunas");
    }

    if (hutang.statusHutang === "cancel") {
      throw new ResponseError(400, "Hutang sudah dibatalkan");
    }

    // Validate payment amount
    const sisaHutang = parseFloat(hutang.sisaHutang.toString());
    const jumlahBayar = parseFloat(jumlah_bayar);

    if (jumlahBayar <= 0) {
      throw new ResponseError(400, "Jumlah bayar harus lebih dari 0");
    }

    if (jumlahBayar > sisaHutang) {
      throw new ResponseError(
        400,
        `Jumlah bayar melebihi sisa hutang. Sisa hutang: ${sisaHutang}`
      );
    }

    // Calculate new values
    const newJumlahBayar = parseFloat(hutang.jumlahBayar.toString()) + jumlahBayar;
    const newSisaHutang = sisaHutang - jumlahBayar;
    const isLunas = newSisaHutang <= 0.01; // Consider paid if difference is less than 0.01 (rounding)
    const newStatusHutang = isLunas ? "lunas" : "aktif";

    // Create pembayaran hutang record using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create pembayaran hutang record
      const pembayaran = await tx.pembayaranHutang.create({
        data: {
          hutangId: hutang_id,
          tanggalBayar: new Date(),
          jumlahBayar: jumlahBayar,
          metodePembayaran: metode_pembayaran,
          nomorReferensi: nomor_referensi || null,
          buktiUrl: bukti_url || null,
          keterangan: keterangan || `Pembayaran hutang ${hutang.nomorReferensi}`,
          userId: auditInfo.userId,
          created_by: auditInfo.userName,
          updated_by: auditInfo.userName,
          created_by_user_Id: auditInfo.userId,
          updated_by_user_Id: auditInfo.userId,
        },
      });

      // Update hutang
      await tx.hutang.update({
        where: { id: hutang_id },
        data: {
          jumlahBayar: newJumlahBayar,
          sisaHutang: isLunas ? 0 : newSisaHutang,
          statusHutang: newStatusHutang,
          updated_by: auditInfo.userName,
          updated_by_user_Id: auditInfo.userId,
        },
      });

      // If fully paid, update related transaction status
      if (isLunas && hutang.transaksiId) {
        await tx.transaksi.update({
          where: { transaksi_id: hutang.transaksiId },
          data: {
            status_pembayaran: "LUNAS",
          },
        });
      }

      return pembayaran;
    });

    // Invalidate cache
    await cacheDeletePattern(`hutang:${hutang.cabangId}:*`);
    await cacheDeletePattern(`hutang-list:*`);
    if (hutang.transaksiId) {
      await invalidateTransaksiCache(hutang.transaksiId);
    }

    // Return complete payment info
    const pembayaranWithHutang = await prisma.pembayaranHutang.findUnique({
      where: { id: result.id },
      include: {
        hutang: {
          include: {
            pelanggan: {
              select: {
                id: true,
                namaPelanggan: true,
                telepon: true,
              },
            },
            supplier: {
              select: {
                id: true,
                namaSupplier: true,
                telepon: true,
              },
            },
            transaksi: {
              select: {
                transaksi_id: true,
                nomor_transaksi: true,
                total: true,
              },
            },
            cabang: {
              select: {
                id: true,
                namaCabang: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
    });

    return pembayaranWithHutang;
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    console.error("Error in createPembayaranHutang:", error);
    throw new ResponseError(500, "Terjadi kesalahan saat memproses pembayaran hutang");
  }
};

/**
 * Get hutang by ID with complete information
 */
const getHutangById = async (hutangId) => {
  const cacheKey = createCacheKey("hutang", hutangId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const hutang = await prisma.hutang.findUnique({
        where: { id: hutangId },
        include: {
          pelanggan: {
            select: {
              id: true,
              namaPelanggan: true,
              telepon: true,
              email: true,
              alamat: true,
            },
          },
          supplier: {
            select: {
              id: true,
              namaSupplier: true,
              telepon: true,
              email: true,
              alamat: true,
            },
          },
          transaksi: {
            select: {
              transaksi_id: true,
              nomor_transaksi: true,
              jenis_transaksi: true,
              tanggal: true,
              subtotal: true,
              diskon: true,
              pajak: true,
              biaya_tambahan: true,
              total: true,
              status_pembayaran: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
              alamat: true,
            },
          },
          pembayaranHutang: {
            orderBy: {
              tanggalBayar: "desc",
            },
            include: {
              createdByUser: {
                select: {
                  id: true,
                  namaLengkap: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
      });

      if (!hutang) {
        throw new ResponseError(404, "Hutang tidak ditemukan");
      }

      // Calculate payment progress
      const persentaseBayar = hutang.jumlahTotal > 0
        ? (parseFloat(hutang.jumlahBayar.toString()) / parseFloat(hutang.jumlahTotal.toString())) * 100
        : 0;

      return {
        ...hutang,
        persentaseBayar: Math.round(persentaseBayar * 100) / 100,
        sisaHutang: parseFloat(hutang.sisaHutang.toString()),
        jumlahTotal: parseFloat(hutang.jumlahTotal.toString()),
        jumlahBayar: parseFloat(hutang.jumlahBayar.toString()),
      };
    },
    3600
  ); // Cache 1 jam
};

/**
 * Get list of hutang with filters
 */
const getHutangList = async (filters) => {
  const {
    cabang_id,
    jenis_hutang, // 'pelanggan' or 'supplier'
    status_hutang, // 'aktif', 'lunas', 'cancel'
    pelanggan_id,
    supplier_id,
    tanggal_mulai,
    tanggal_akhir,
    jatuh_tempo_mulai,
    jatuh_tempo_akhir,
    search,
    page = 1,
    limit = 10,
  } = filters;

  const cacheKey = createCacheKey(
    "hutang-list",
    `cabang:${cabang_id || "-"}-jenis:${jenis_hutang || "-"}-status:${
      status_hutang || "-"
    }-pelanggan:${pelanggan_id || "-"}-supplier:${supplier_id || "-"}-start:${
      tanggal_mulai || "-"
    }-end:${tanggal_akhir || "-"}-jt-start:${jatuh_tempo_mulai || "-"}-jt-end:${
      jatuh_tempo_akhir || "-"
    }-search:${search || "-"}-page:${page}-limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (cabang_id) where.cabangId = cabang_id;
      if (jenis_hutang) where.jenisHutang = jenis_hutang;
      if (status_hutang) where.statusHutang = status_hutang;
      if (pelanggan_id) where.pelangganId = pelanggan_id;
      if (supplier_id) where.supplierId = supplier_id;

      // Filter by date range (tanggal hutang)
      if (tanggal_mulai || tanggal_akhir) {
        where.tanggalHutang = {};
        if (tanggal_mulai) where.tanggalHutang.gte = new Date(tanggal_mulai);
        if (tanggal_akhir) where.tanggalHutang.lte = new Date(tanggal_akhir);
      }

      // Filter by jatuh tempo range
      if (jatuh_tempo_mulai || jatuh_tempo_akhir) {
        where.jatuhTempo = {};
        if (jatuh_tempo_mulai) where.jatuhTempo.gte = new Date(jatuh_tempo_mulai);
        if (jatuh_tempo_akhir) where.jatuhTempo.lte = new Date(jatuh_tempo_akhir);
      }

      // Search by nomor referensi or keterangan
      if (search) {
        where.OR = [
          { nomorReferensi: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get total count
      const totalCount = await prisma.hutang.count({ where });

      // Get data with pagination
      const hutangList = await prisma.hutang.findMany({
        where,
        include: {
          pelanggan: {
            select: {
              id: true,
              namaPelanggan: true,
            },
          },
          supplier: {
            select: {
              id: true,
              namaSupplier: true,
            },
          },
          transaksi: {
            select: {
              transaksi_id: true,
              nomor_transaksi: true,
              jenis_transaksi: true,
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
              pembayaranHutang: true,
            },
          },
        },
        orderBy: {
          tanggalHutang: "desc",
        },
        skip,
        take: limit,
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: hutangList,
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

/**
 * Get hutang summary for a customer or supplier
 */
const getHutangSummary = async (entityType, entityId) => {
  const where = {
    statusHutang: "aktif",
  };

  if (entityType === "pelanggan") {
    where.pelangganId = entityId;
    where.jenisHutang = "pelanggan";
  } else if (entityType === "supplier") {
    where.supplierId = entityId;
    where.jenisHutang = "supplier";
  } else {
    throw new ResponseError(400, "Entity type harus 'pelanggan' atau 'supplier'");
  }

  const hutang = await prisma.hutang.findMany({
    where,
    select: {
      id: true,
      nomorReferensi: true,
      tanggalHutang: true,
      jatuhTempo: true,
      jumlahTotal: true,
      jumlahBayar: true,
      sisaHutang: true,
      statusHutang: true,
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: {
      jatuhTempo: "asc",
    },
  });

  const totalHutang = hutang.reduce((sum, h) => sum + parseFloat(h.sisaHutang.toString()), 0);

  // Check for overdue debts
  const overdue = hutang.filter(h => h.jatuhTempo < new Date() && h.statusHutang === "aktif");

  return {
    totalHutang: totalHutang,
    totalAktif: hutang.length,
    totalJatuhTempo: overdue.length,
    detail: hutang.map(h => ({
      ...h,
      jumlahTotal: parseFloat(h.jumlahTotal.toString()),
      jumlahBayar: parseFloat(h.jumlahBayar.toString()),
      sisaHutang: parseFloat(h.sisaHutang.toString()),
      isJatuhTempo: h.jatuhTempo < new Date() && h.statusHutang === "aktif",
    })),
  };
};

/**
 * Get payment history for a specific hutang
 */
const getPembayaranHistory = async (hutangId) => {
  const pembayaranList = await prisma.pembayaranHutang.findMany({
    where: { hutangId },
    include: {
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      hutang: {
        select: {
          nomorReferensi: true,
          jumlahTotal: true,
        },
      },
    },
    orderBy: {
      tanggalBayar: "desc",
    },
  });

  return pembayaranList.map(p => ({
    ...p,
    jumlahBayar: parseFloat(p.jumlahBayar.toString()),
  }));
};

module.exports = {
  createPembayaranHutang,
  getHutangById,
  getHutangList,
  getHutangSummary,
  getPembayaranHistory,
};
