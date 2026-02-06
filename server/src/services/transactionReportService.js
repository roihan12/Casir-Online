const prisma = require("../config/db");
const redis = require("../config/redis");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

/**
 * Service for Transaction Detail Reporting
 * Provides comprehensive transaction audit and analysis
 */
class TransactionReportService {
  /**
   * Get detailed transaction list
   * @param {Object} filters - { startDate, endDate, cabangId, status, metodePembayaran, search }
   * @returns {Promise<Object>} Transaction list with pagination
   */
  async getTransactionDetail(filters) {
    const {
      startDate,
      endDate,
      cabangId,
      status,
      metodePembayaran,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const whereClause = {
      deleted_at: null,
      tanggal: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
    };

    if (cabangId !== "all") whereClause.cabang_id = cabangId;
    if (status) whereClause.status_pembayaran = status;
    if (search) {
      whereClause.OR = [
        { nomor_transaksi: { contains: search, mode: "insensitive" } },
        { transaksi_id: { contains: search, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaksi.findMany({
        where: whereClause,
        include: {
          cabang: {
            select: { namaCabang: true },
          },
          pelanggan: {
            select: { namaPelanggan: true },
          },
          shift: {
            include: {
              user: {
                select: { namaLengkap: true },
              },
            },
          },
          pembayaran: true,
          transaksi_detail: {
            include: {
              produk: {
                include: {
                  produkMaster: true,
                },
              },
            },
          },
        },
        orderBy: { tanggal: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaksi.count({ where: whereClause }),
    ]);

    // Filter by payment method if specified
    let filteredTransactions = transactions;
    if (metodePembayaran) {
      filteredTransactions = transactions.filter((tx) =>
        tx.pembayaran.some((p) => p.metode_pembayaran === metodePembayaran)
      );
    }

    const result = filteredTransactions.map((tx) => ({
      transaksiId: tx.transaksi_id,
      nomorTransaksi: tx.nomor_transaksi,
      tanggal: tx.tanggal,
      jenisTransaksi: tx.jenis_transaksi,
      cabang: tx.cabang?.namaCabang || "-",
      pelanggan: tx.pelanggan?.namaPelanggan || "Umum",
      kasir: tx.shift?.user?.namaLengkap || "-",
      subtotal: parseFloat(tx.subtotal),
      diskon: parseFloat(tx.diskon),
      pajak: parseFloat(tx.pajak),
      biayaTambahan: parseFloat(tx.biaya_tambahan),
      total: parseFloat(tx.total),
      statusPembayaran: tx.status_pembayaran,
      metodePembayaran: tx.pembayaran.map((p) => p.metode_pembayaran).join(", "),
      jumlahItem: tx.transaksi_detail.length,
      items: tx.transaksi_detail.map((detail) => ({
        produk: detail.produk.produkMaster.namaProduk,
        jumlah: detail.jumlah,
        hargaSatuan: parseFloat(detail.harga_satuan),
        diskon: parseFloat(detail.diskon_nominal),
        subtotal: parseFloat(detail.subtotal),
      })),
      keterangan: tx.keterangan,
    }));

    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction summary by status
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Object>} Summary metrics
   */
  async getTransactionSummary(filters) {
    const { startDate, endDate, cabangId } = filters;

    const whereClause = {
      deleted_at: null,
      tanggal: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
    };

    if (cabangId) whereClause.cabang_id = cabangId;

    const [totalData, successData, voidData, refundData] = await Promise.all([
      prisma.transaksi.aggregate({
        where: whereClause,
        _count: { transaksi_id: true },
        _sum: { total: true },
      }),
      prisma.transaksi.aggregate({
        where: { ...whereClause, status_pembayaran: 'LUNAS' },
        _count: { transaksi_id: true },
        _sum: { total: true },
      }),
      prisma.transaksi.count({
        where: { ...whereClause, status_pembayaran: 'BELUM_LUNAS' },
      }),
      prisma.transaksi.aggregate({
        where: { ...whereClause, status_pembayaran: 'DIBATALKAN' },
        _count: { transaksi_id: true },
        _sum: { total: true },
      }),
    ]);

    const result = {
      total: {
        count: totalData._count.transaksi_id,
        amount: parseFloat(totalData._sum.total || 0),
      },
      success: {
        count: successData._count.transaksi_id,
        amount: parseFloat(successData._sum.total || 0),
      },
      void: {
        count: voidData,
      },
      refund: {
        count: refundData._count.transaksi_id,
        amount: parseFloat(refundData._sum.total || 0),
      },
      avgTransactionAmount:
        successData._count.transaksi_id > 0
          ? parseFloat(successData._sum.total || 0) /
            successData._count.transaksi_id
          : 0,
    };

   
 

    return result;
  }

  /**
   * Get audit trail for voided/refunded transactions
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Array>} Audit log
   */
  async getAuditTrail(filters) {
    const { startDate, endDate, cabangId } = filters;

    const whereClause = {
      tanggal: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
      jenis_transaksi: {
        in: ["RETUR_PENJUALAN", "RETUR_PEMBELIAN"],
      },
    };

    if (cabangId !== "all") whereClause.cabang_id = cabangId;

    const transactions = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        cabang: {
          select: { namaCabang: true },
        },
        shift: {
          include: {
            user: {
              select: { namaLengkap: true },
            },
          },
        },
        pelanggan: {
          select: { namaPelanggan: true },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return transactions.map((tx) => ({
      transaksiId: tx.transaksi_id,
      nomorTransaksi: tx.nomor_transaksi,
      tanggal: tx.tanggal,
      cabang: tx.cabang?.namaCabang || "-",
      kasir: tx.shift?.user?.namaLengkap || "-",
      pelanggan: tx.pelanggan?.namaPelanggan || "Umum",
      total: parseFloat(tx.total),
      status: tx.status_pembayaran,
      keterangan: tx.keterangan,
      updatedAt: tx.updated_at,
      updatedBy: tx.updated_by,
    }));
  }
}

module.exports = new TransactionReportService();
