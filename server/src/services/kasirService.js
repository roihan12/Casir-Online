const prisma = require("../config/db");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

class KasirService {
  /**
   * Get all dashboard data for kasir (cashier)
   * @param {Object} user - User object
   * @param {String} cabangId - Branch ID (optional)
   * @returns {Promise<Object>} Dashboard data
   */
  static async getKasirDashboardData(user, cabangId = null) {
    // Create cache key based on user and branch
    const cacheKey = createCacheKey(
      "kasir-dashboard",
      `${user.id}:${cabangId || "primary"}`
    );

    // Cache TTL for kasir dashboard (2 minutes)
    const dashboardTTL = 120;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Get primary branch if no branch ID specified
        if (!cabangId) {
          const primaryBranch = user.userCabang.find((uc) => uc.isPrimary);
          cabangId = primaryBranch ? primaryBranch.cabangId : null;
        }

        // If still no branch ID, return error
        if (!cabangId) {
          throw new Error("Tidak ada cabang yang ditemukan untuk user ini");
        }

        // Check if user has kasir role for this branch
        const hasKasirRole = user.userRoles.some(
          (ur) => ur.role.namaRole === "kasir" && ur.cabangId === cabangId
        );

        if (!hasKasirRole) {
          throw new Error("User tidak memiliki akses kasir untuk cabang ini");
        }

        // Get current date (for today's transactions)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate last 7 days for sales trend
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);

        // Fetch all dashboard data in parallel
        const [
          todaySalesSummary,
          activeShift,
          topProducts,
          dailySalesTrend,
          lowStockProducts,
          recentTransactions,
        ] = await Promise.all([
          // Today's sales summary
          prisma.transaksi.aggregate({
            where: {
              jenis_transaksi: "PENJUALAN",
              tanggal: {
                gte: today,
              },
              cabang_id: cabangId,
              user_id: user.id,
            },
            _sum: {
              total: true,
              diskon: true,
            },
            _count: { transaksi_id: true },
          }),

          // Get active shift
          prisma.shift.findFirst({
            where: {
              userId: user.id,
              cabangId: cabangId,
              status: "dibuka",
            },
            orderBy: {
              waktuMulai: "desc",
            },
          }),

          // Top selling products
          prisma.transaksiDetail.groupBy({
            by: ["produk_id"],
            where: {
              transaksi: {
                jenis_transaksi: "PENJUALAN",
                status_pembayaran: "LUNAS",
                cabang_id: cabangId,
                tanggal: {
                  gte: lastWeek,
                },
              },
            },
            _sum: { jumlah: true },
            orderBy: {
              _sum: {
                jumlah: "desc",
              },
            },
            take: 10,
          }),

          // Daily sales trend (last 7 days)
          prisma.transaksi.groupBy({
            by: ["tanggal"],
            where: {
              jenis_transaksi: "PENJUALAN",
              status_pembayaran: "LUNAS",
              cabang_id: cabangId,
              tanggal: {
                gte: lastWeek,
              },
            },
            _sum: { total: true },
            orderBy: {
              tanggal: "asc",
            },
          }),

          // Low stock products
          prisma.produk.findMany({
            where: {
              cabangId: cabangId,
              stok: {
                lte: prisma.produk.fields.minStok,
              },
            },
            include: { produkMaster: true },
            take: 5,
          }),

          // Recent transactions
          prisma.transaksi.findMany({
            where: {
              jenis_transaksi: "PENJUALAN",
              cabang_id: cabangId,
              tanggal: {
                gte: today,
              },
            },
            orderBy: {
              tanggal: "desc",
            },
            take: 20,
            include: {
              pelanggan: true,
              pembayaran: true,
            },
          }),
        ]);

        // Get detailed product information for top products
        const topProductsDetails = await Promise.all(
          topProducts.map(async (product) => {
            const productDetails = await prisma.produk.findUnique({
              where: {
                id: product.produk_id,
                cabangId: cabangId,
              },
              include: {
                produkMaster: true,
              },
            });
            return productDetails
              ? {
                  ...productDetails,
                  soldQuantity: product._sum.jumlah,
                }
              : null;
          })
        ).then((results) => results.filter((result) => result !== null));

        // Get branch information
        const branchInfo = await prisma.cabang.findUnique({
          where: {
            id: cabangId,
          },
        });

        // Construct response
        const dashboardData = {
          userProfile: {
            roles: user.userRoles.map((ur) => ur.role),
            primaryBranch: user.userCabang.find((uc) => uc.isPrimary)?.cabang,
          },
          selectedBranch: {
            id: branchInfo.id,
            name: branchInfo.namaCabang,
          },
          overview: {
            totalSales: {
              amount: todaySalesSummary._sum.total || 0,
              discount: todaySalesSummary._sum.diskon || 0,
              transactionCount: todaySalesSummary._count.transaksi_id || 0,
            },
          },
          topProducts: topProductsDetails,
          dailySalesTrend,
          lowStockProducts,
          recentTransactions,
          activeShift: activeShift || null,
        };

        return dashboardData;
      },
      dashboardTTL
    );
  }

  /**
   * Get active shift for the cashier
   * @param {String} userId - User ID
   * @param {String} cabangId - Branch ID
   * @returns {Promise<Object>} Active shift data
   */
  static async getActiveShift(userId, cabangId) {
    const cacheKey = createCacheKey(
      "active-shift-kasir",
      `${userId}:${cabangId}`
    );

    // Short TTL for active shift (30 seconds)
    const shiftTTL = 30;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        const activeShift = await prisma.shift.findFirst({
          where: {
            userId,
            cabangId,
            status: "dibuka",
          },
        });

        if (!activeShift) {
          return null;
        }

        // Get shift statistics
        const shiftStats = await prisma.transaksi.aggregate({
          where: {
            shift_id: activeShift.id,
            jenis_transaksi: "PENJUALAN",
          },
          _sum: {
            total: true,
          },
          _count: {
            transaksi_id: true,
          },
        });

        return {
          ...activeShift,
          statistics: {
            totalTransactions: shiftStats._count.transaksi_id || 0,
            totalAmount: shiftStats._sum.total || 0,
          },
        };
      },
      shiftTTL
    );
  }

  /**
   * Open a new shift for the cashier
   * @param {String} userId - User ID
   * @param {String} cabangId - Branch ID
   * @param {Number} kasAwal - Initial cash amount
   * @returns {Promise<Object>} Created shift
   */
  static async openShift(userId, cabangId, kasAwal) {
    // Check if there's an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        cabangId,
        status: "dibuka",
      },
    });

    if (activeShift) {
      throw new Error(
        "Anda sudah memiliki shift aktif. Tutup shift sebelumnya terlebih dahulu."
      );
    }

    // Create new shift
    const newShift = await prisma.shift.create({
      data: {
        userId,
        cabangId,
        waktuMulai: new Date(),
        kasAwal,
        status: "dibuka",
      },
    });

    // Invalidate cache
    await this.invalidateShiftCache(userId, cabangId);
    await this.invalidateDashboardCache(userId, cabangId);

    return newShift;
  }

  /**
   * Close an active shift
   * @param {String} userId - User ID
   * @param {String} cabangId - Branch ID
   * @param {Number} kasAkhir - Final cash amount
   * @param {String} keterangan - Notes
   * @returns {Promise<Object>} Updated shift
   */
  static async closeShift(userId, cabangId, kasAkhir, keterangan = "") {
    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        cabangId,
        status: "dibuka",
      },
    });

    if (!activeShift) {
      throw new Error("Tidak ada shift aktif untuk ditutup");
    }

    // Calculate shift statistics
    const shiftStats = await prisma.transaksi.aggregate({
      where: {
        shift_id: activeShift.id,
        jenis_transaksi: "PENJUALAN",
      },
      _sum: {
        total: true,
      },
      _count: {
        transaksi_id: true,
      },
    });

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: {
        id: activeShift.id,
      },
      data: {
        waktuSelesai: new Date(),
        kasAkhir,
        totalTransaksi: shiftStats._count.transaksi_id || 0,
        totalPendapatan: shiftStats._sum.total || 0,
        keterangan,
        status: "ditutup",
      },
    });

    // Invalidate cache
    await this.invalidateShiftCache(userId, cabangId);
    await this.invalidateDashboardCache(userId, cabangId);

    return updatedShift;
  }

  /**
   * Get shifts history for the cashier
   * @param {String} userId - User ID
   * @param {String} cabangId - Branch ID
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise<Object>} Paginated shifts history
   */
  static async getShiftsHistory(userId, cabangId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [shifts, totalCount] = await Promise.all([
      prisma.shift.findMany({
        where: {
          userId,
          cabangId,
        },
        orderBy: {
          waktuMulai: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.shift.count({
        where: {
          userId,
          cabangId,
        },
      }),
    ]);

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
  }

  /**
   * Search products for kasir interface
   * @param {String} query - Search query
   * @param {String} cabangId - Branch ID
   * @param {Number} limit - Results limit
   * @returns {Promise<Array>} Products matching the search
   */
  static async searchProducts(query, cabangId, limit = 10) {
    return await prisma.produk.findMany({
      where: {
        cabangId,
        OR: [
          {
            produkMaster: {
              namaProduk: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            produkMaster: {
              sku: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            produkMaster: {
              barcode: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
        status: "tersedia",
        stok: {
          gt: 0,
        },
      },
      include: {
        produkMaster: true,
      },
      take: limit,
    });
  }

  /**
   * Get product by barcode or SKU
   * @param {String} code - Barcode or SKU
   * @param {String} cabangId - Branch ID
   * @returns {Promise<Object>} Product details
   */
  static async getProductByCode(code, cabangId) {
    return await prisma.produk.findFirst({
      where: {
        cabangId,
        OR: [
          {
            produkMaster: {
              sku: code,
            },
          },
          {
            produkMaster: {
              barcode: code,
            },
          },
        ],
        status: "tersedia",
      },
      include: {
        produkMaster: true,
      },
    });
  }

  /**
   * Create a new sales transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  static async createTransaction(transactionData) {
    const {
      cabangId,
      userId,
      shiftId,
      pelangganId,
      items,
      subtotal,
      diskon,
      pajak,
      biayaTambahan,
      total,
      metodePembayaran,
      jumlahBayar,
      jumlahKembali,
      keterangan,
    } = transactionData;

    // Generate transaction number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Get count of today's transactions for numbering
    const transactionCount = await prisma.transaksi.count({
      where: {
        nomor_transaksi: {
          startsWith: `TRX-${dateStr}`,
        },
      },
    });

    const transactionNumber = `TRX-${dateStr}-${(transactionCount + 1)
      .toString()
      .padStart(3, "0")}`;

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create transaction
      const transaction = await prisma.transaksi.create({
        data: {
          cabang_id: cabangId,
          nomor_transaksi: transactionNumber,
          jenis_transaksi: "PENJUALAN",
          tanggal: today,
          pelanggan_id: pelangganId || null,
          user_id: userId,
          shift_id: shiftId,
          subtotal,
          diskon,
          pajak,
          biaya_tambahan: biayaTambahan,
          total,
          status_pembayaran: "LUNAS",
          tanggal_lunas: today,
          keterangan,
        },
      });

      // Create transaction details
      for (const item of items) {
        await prisma.transaksiDetail.create({
          data: {
            transaksi_id: transaction.transaksi_id,
            produk_id: item.produkId,
            jumlah: item.quantity,
            harga_satuan: item.hargaSatuan,
            diskon_persen: item.diskonPersen || 0,
            diskon_nominal: item.diskonNominal || 0,
            subtotal: item.subtotal,
            pajak_persen: item.pajakPersen || 0,
            total: item.total,
          },
        });

        // Update product stock
        await prisma.produk.update({
          where: {
            id: item.produkId,
          },
          data: {
            stok: {
              decrement: item.quantity,
            },
          },
        });

        // Create inventory movement record
        await prisma.inventoryMovement.create({
          data: {
            produkId: item.produkId,
            cabangId,
            referenceId: transaction.transaksi_id,
            referenceType: "penjualan",
            quantity: -item.quantity, // Negative for sales
            keterangan: `Penjualan: ${transactionNumber}`,
            userId,
          },
        });
      }

      // Create payment record
      await prisma.pembayaran.create({
        data: {
          transaksi_id: transaction.transaksi_id,
          metode_pembayaran: metodePembayaran,
          jumlah_bayar: jumlahBayar,
          jumlah_kembali: jumlahKembali,
          tanggal_pembayaran: today,
          user_id: userId,
          status: "SUKSES",
        },
      });

      return transaction;
    });

    // Invalidate caches
    await this.invalidateDashboardCache(userId, cabangId);
    await this.invalidateShiftCache(userId, cabangId);

    return result;
  }

  /**
   * Search customers for kasir interface
   * @param {String} query - Search query
   * @param {String} cabangId - Branch ID
   * @param {Number} limit - Results limit
   * @returns {Promise<Array>} Customers matching the search
   */
  static async searchCustomers(query, cabangId, limit = 10) {
    return await prisma.pelanggan.findMany({
      where: {
        cabang_id: cabangId,
        OR: [
          {
            namaPelanggan: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            telepon: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        status: "aktif",
      },
      take: limit,
    });
  }

  /**
   * Get transaction details
   * @param {String} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  static async getTransactionDetails(transactionId) {
    const cacheKey = createCacheKey("transaction-details", transactionId);

    // Cache transaction details for 5 minutes
    const transactionTTL = 300;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        const transaction = await prisma.transaksi.findUnique({
          where: {
            transaksi_id: transactionId,
          },
          include: {
            transaksi_detail: {
              include: {
                produk: {
                  include: {
                    produkMaster: true,
                  },
                },
              },
            },
            cabang: true,
            pelanggan: true,
            user: true,
            pembayaran: true,
          },
        });

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        return transaction;
      },
      transactionTTL
    );
  }

  /**
   * Get recent transactions for a user and branch
   * @param {String} userId - User ID
   * @param {String} cabangId - Branch ID
   * @param {Number} limit - Results limit
   * @returns {Promise<Array>} Recent transactions
   */
  static async getRecentTransactions(userId, cabangId, limit = 10) {
    const cacheKey = createCacheKey(
      "recent-transactions",
      `${userId}:${cabangId}:${limit}`
    );

    // Cache recent transactions for 1 minute
    const recentTransactionsTTL = 60;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await prisma.transaksi.findMany({
          where: {
            cabang_id: cabangId,
            user_id: userId,
            jenis_transaksi: "PENJUALAN",
            tanggal: {
              gte: today,
            },
          },
          orderBy: {
            tanggal: "desc",
          },
          take: limit,
          include: {
            pelanggan: true,
            pembayaran: true,
          },
        });

        return transactions;
      },
      recentTransactionsTTL
    );
  }

  /**
   * Print receipt for a transaction
   * @param {String} transactionId - Transaction ID
   * @returns {Promise<Object>} Receipt data
   */
  static async printReceipt(transactionId) {
    // Get transaction details
    const transaction = await this.getTransactionDetails(transactionId);

    // Get receipt configuration for the branch
    const receiptConfig = await prisma.receiptConfig.findFirst({
      where: {
        cabangId: transaction.cabang_id,
      },
    });

    // Format the receipt data
    const receiptData = {
      transaction,
      config: receiptConfig || {
        // Default config if none found
        headerText: "Struk Pembayaran",
        footerText: "Terima Kasih",
        showTaxDetails: true,
        showCashierName: true,
      },
      // Additional receipt metadata
      printedAt: new Date(),
    };

    // In a real implementation, here you might send the data to a thermal printer
    // or generate a PDF or HTML for printing

    return receiptData;
  }

  /**
   * Get receipt configuration for a branch
   * @param {String} cabangId - Branch ID
   * @returns {Promise<Object>} Receipt configuration
   */
  static async getReceiptConfig(cabangId) {
    const cacheKey = createCacheKey("receipt-config", cabangId);

    // Cache receipt config for 1 hour (unlikely to change frequently)
    const receiptConfigTTL = 3600;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        const config = await prisma.receiptConfig.findFirst({
          where: {
            cabangId,
          },
        });

        // Return default config if none found
        return (
          config || {
            cabangId,
            headerText: "Struk Pembayaran",
            footerText: "Terima Kasih",
            showTaxDetails: true,
            showCashierName: true,
            printPaperWidth: 80,
            printAutomatically: false,
            thankYouMessage: "Terima kasih atas kunjungan Anda",
            showQrCode: true,
            fontSize: 12,
            language: "id",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        );
      },
      receiptConfigTTL
    );
  }

  /**
   * Get daily sales summary
   * @param {String} cabangId - Branch ID
   * @param {String} date - Date string (YYYY-MM-DD)
   * @returns {Promise<Object>} Daily summary
   */
  static async getDailySummary(cabangId, date = null) {
    // Parse date or use today
    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    targetDate.setHours(0, 0, 0, 0);

    // Format date for cache key
    const dateStr = targetDate.toISOString().split("T")[0];
    const cacheKey = createCacheKey("daily-summary", `${cabangId}:${dateStr}`);

    // Cache daily summary for 15 minutes
    const dailySummaryTTL = 900;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Calculate end of day
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        // Get summary of sales
        const salesSummary = await prisma.transaksi.aggregate({
          where: {
            cabang_id: cabangId,
            tanggal: {
              gte: targetDate,
              lte: endDate,
            },
            jenis_transaksi: "PENJUALAN",
          },
          _sum: {
            subtotal: true,
            diskon: true,
            pajak: true,
            biaya_tambahan: true,
            total: true,
          },
          _count: {
            transaksi_id: true,
          },
        });

        // Get payment methods breakdown
        const paymentBreakdown = await prisma.pembayaran.groupBy({
          by: ["metode_pembayaran"],
          where: {
            transaksi: {
              cabang_id: cabangId,
              tanggal: {
                gte: targetDate,
                lte: endDate,
              },
              jenis_transaksi: "PENJUALAN",
            },
          },
          _sum: {
            jumlah_bayar: true,
          },
        });

        // Get top selling products
        const topProducts = await prisma.transaksiDetail.groupBy({
          by: ["produk_id"],
          where: {
            transaksi: {
              cabang_id: cabangId,
              tanggal: {
                gte: targetDate,
                lte: endDate,
              },
              jenis_transaksi: "PENJUALAN",
            },
          },
          _sum: {
            jumlah: true,
            total: true,
          },
          orderBy: {
            _sum: {
              total: "desc",
            },
          },
          take: 5,
        });

        // Get product details for top products
        const topProductsWithDetails = await Promise.all(
          topProducts.map(async (product) => {
            const details = await prisma.produk.findUnique({
              where: {
                id: product.produk_id,
                cabangId: cabangId,
              },
              include: {
                produkMaster: true,
              },
            });
            return {
              ...details,
              soldQuantity: product._sum.jumlah,
              totalSales: product._sum.total,
            };
          })
        );

        // Construct response
        const summary = {
          date: dateStr,
          sales: {
            count: salesSummary._count.transaksi_id || 0,
            subtotal: salesSummary._sum.subtotal || 0,
            discount: salesSummary._sum.diskon || 0,
            tax: salesSummary._sum.pajak || 0,
            additionalFees: salesSummary._sum.biaya_tambahan || 0,
            total: salesSummary._sum.total || 0,
          },
          paymentMethods: paymentBreakdown,
          topProducts: topProductsWithDetails,
        };

        return summary;
      },
      dailySummaryTTL
    );
  }

  // Cache invalidation methods
  static async invalidateDashboardCache(userId = null, cabangId = null) {
    if (userId && cabangId) {
      await cacheDelete(
        createCacheKey("kasir-dashboard", `${userId}:${cabangId}`)
      );
    } else if (userId) {
      await cacheDeletePattern(createCacheKey("kasir-dashboard", `${userId}:*`));
    } else {
      // Invalidate all dashboard cache if no userId and cabangId
      await cacheDeletePattern("kasir-dashboard:*");
    }
  }

  static async invalidateShiftCache(userId, cabangId) {
    await cacheDelete(
      createCacheKey("active-shift-kasir", `${userId}:${cabangId}`)
    );
  }

  static async invalidateTransactionCache(transactionId) {
    await cacheDelete(createCacheKey("transaction-details", transactionId));
  }

  static async invalidateRecentTransactionsCache(userId, cabangId) {
    await cacheDelete(
      createCacheKey("recent-transactions", `${userId}:${cabangId}:*`)
    );
  }

  static async invalidateDailySummaryCache(cabangId, date = null) {
    if (date) {
      await cacheDelete(createCacheKey("daily-summary", `${cabangId}:${date}`));
    } else {
      await cacheDeletePattern(createCacheKey("daily-summary", `${cabangId}:*`));
    }
  }
}

module.exports = KasirService;
