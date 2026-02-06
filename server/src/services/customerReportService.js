const prisma = require("../config/db");
const { cacheOrFetch, createCacheKey } = require("../utils/redisUtils");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

/**
 * Service for Customer & Loyalty Reporting
 * Provides customer analytics and loyalty program insights
 */
class CustomerReportService {
  /**
   * Get customer summary metrics
   * @param {Object} filters - { startDate, endDate, cabangId, segmen }
   * @returns {Promise<Object>} Customer summary
   */
  async getCustomerSummary(filters) {
    const { startDate, endDate, cabangId, segmen } = filters;

    const cacheKey = createCacheKey(
      "customer:summary",
      `${cabangId || "all"}:${segmen || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const customerWhere = {
          deletedAt: null,
          status: "aktif",
        };

        if (cabangId && cabangId !== "all") customerWhere.cabang_id = cabangId;
        if (segmen) customerWhere.segmen = segmen;

        const [totalCustomers, newCustomers, totalPoints] = await Promise.all([
          prisma.pelanggan.count({ where: customerWhere }),
          prisma.pelanggan.count({
            where: {
              ...customerWhere,
              createdAt: {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate)),
              },
            },
          }),
          prisma.pelanggan.aggregate({
            where: customerWhere,
            _sum: { poin: true },
          }),
        ]);

        // Get transaction metrics for customers
        const transactionWhere = {
          deleted_at: null,
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
          pelanggan_id: { not: null },
        };

        if (cabangId && cabangId !== "all") transactionWhere.cabang_id = cabangId;

        const transactionMetrics = await prisma.transaksi.aggregate({
            where: transactionWhere,
          _count: { transaksi_id: true },
          _sum: { total: true },
        });

        return {
          totalCustomers,
          newCustomers,
          totalPoints: parseInt(totalPoints._sum.poin || 0),
          totalTransactions: transactionMetrics._count.transaksi_id,
          totalRevenue: parseFloat(transactionMetrics._sum.total || 0),
          avgTransactionPerCustomer:
            totalCustomers > 0
              ? transactionMetrics._count.transaksi_id / totalCustomers
              : 0,
          avgRevenuePerCustomer:
            totalCustomers > 0
              ? parseFloat(transactionMetrics._sum.total || 0) / totalCustomers
              : 0,
        };
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get top customers by spending
   * @param {Object} filters - { startDate, endDate, cabangId, limit }
   * @returns {Promise<Array>} Top customers
   */
  async getTopCustomers(filters) {
    const { startDate, endDate, cabangId, limit = 10 } = filters;

    const whereClause = {
      deleted_at: null,
      status_pembayaran: 'LUNAS',
      tanggal: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
      pelanggan_id: { not: null },
    };

    if (cabangId !== "all") whereClause.cabang_id = cabangId;

    // Group by customer and aggregate
    const topCustomers = await prisma.transaksi.groupBy({
      by: ["pelanggan_id"],
      where: whereClause,
      _count: { transaksi_id: true },
      _sum: { total: true },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: limit,
    });

    


    // Get customer details
    const result = await Promise.all(
      topCustomers.map(async (item) => {
        const customer = await prisma.pelanggan.findUnique({
          where: { id: item.pelanggan_id },
          select: {
            id: true,
            namaPelanggan: true,
            telepon: true,
            segmen: true,
            poin: true,
          },
        });

        return {
          pelangganId: customer.id,
          namaPelanggan: customer.namaPelanggan,
          telepon: customer.telepon,
          segmen: customer.segmen,
          poin: customer.poin,
          totalTransaksi: item._count.transaksi_id,
          totalBelanja: parseFloat(item._sum.total || 0),
          avgTransaksi:
            item._count.transaksi_id > 0
              ? parseFloat(item._sum.total || 0) / item._count.transaksi_id
              : 0,
        };
      })
    );

    return result;
  }

  /**
   * Get loyalty program metrics
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Object>} Loyalty metrics
   */
  async getLoyaltyReport(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cacheKey = createCacheKey(
      "loyalty:report",
      `${cabangId || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          createdAt: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
        };

        const [pointHistory, redemptions] = await Promise.all([
          prisma.loyaltyPointHistory.aggregate({
            where: whereClause,
            _sum: {
              pointDidapatkan: true,
            },
          }),
          prisma.loyaltyPointHistory.aggregate({
            where: {
              ...whereClause,
              pointDidapatkan: { lt: 0 }, // Negative points = redemption
            },
            _sum: {
              pointDidapatkan: true,
            },
          }),
        ]);

        const totalPointsEarned = parseInt(
          pointHistory._sum.pointDidapatkan || 0
        );
        const totalPointsRedeemed = Math.abs(
          parseInt(redemptions._sum.pointDidapatkan || 0)
        );

        return {
          totalPointsEarned,
          totalPointsRedeemed,
          netPoints: totalPointsEarned - totalPointsRedeemed,
          redemptionRate:
            totalPointsEarned > 0
              ? (totalPointsRedeemed / totalPointsEarned) * 100
              : 0,
        };
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get customer acquisition trend
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Array>} Daily acquisition data
   */
  async getCustomerAcquisition(filters) {
    const { startDate, endDate, cabangId } = filters;

    const whereClause = {
      deletedAt: null,
      status: "aktif",
      createdAt: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
    };

    if (cabangId !== "all") whereClause.cabang_id = cabangId;

    const customers = await prisma.pelanggan.findMany({
      where: whereClause,
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date
    const acquisitionMap = new Map();

    customers.forEach((customer) => {
      const dateKey = customer.createdAt.toISOString().split("T")[0];
      acquisitionMap.set(dateKey, (acquisitionMap.get(dateKey) || 0) + 1);
    });

    return Array.from(acquisitionMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }
}

module.exports = new CustomerReportService();
