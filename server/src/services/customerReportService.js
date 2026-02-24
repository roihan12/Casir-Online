const prisma = require("../config/db");
const { cacheOrFetch, createCacheKey } = require("../utils/redisUtils");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

// ─── Helper ────────────────────────────────────────────────────────────────
const normalizeCabangIds = (cabangId) =>
  cabangId && cabangId !== "all"
    ? cabangId.split(",").map((id) => id.trim()).filter(Boolean)
    : null;

const buildCabangFilter = (cabangIds, field = "cabang_id") => {
  if (!cabangIds) return {};
  return {
    [field]: cabangIds.length === 1 ? cabangIds[0] : { in: cabangIds },
  };
};
// ───────────────────────────────────────────────────────────────────────────

class CustomerReportService {
 async getCustomerSummary(filters) {
  const { startDate, endDate, cabangId, segmen } = filters;

  const cabangIds = normalizeCabangIds(cabangId);
  const cabangFilter = buildCabangFilter(cabangIds);

  const cacheKey = createCacheKey(
    "customer:summary",
    `${cabangIds ? cabangIds.join("-") : "all"}:${segmen || "all"}:${startDate}:${endDate}`
  );

  return cacheOrFetch(
    cacheKey,
    async () => {
      const customerWhere = {
        deletedAt: null,
        ...cabangFilter,
      };
      if (segmen) customerWhere.segmen = segmen.toLowerCase();

      // Hitung durasi periode untuk previous period
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(start);
      const prevEnd = new Date(start);
      prevStart.setDate(prevStart.getDate() - periodDays);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const baseTransactionWhere = {
        deleted_at: null,
        status_pembayaran: "LUNAS",
        pelanggan_id: { not: null },
        ...cabangFilter,
      };

      const currentPeriodWhere = {
        ...baseTransactionWhere,
        tanggal: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      };

      const prevPeriodWhere = {
        ...baseTransactionWhere,
        tanggal: {
          gte: startOfDay(prevStart),
          lte: endOfDay(prevEnd),
        },
      };

      const [
        totalCustomers,
        newCustomers,
        totalPoints,
        transactionMetrics,
        // Untuk Repeat Purchase Rate: customer dengan transaksi > 1
        repeatCustomers,
        // Semua customer yang transaksi di periode ini (untuk RPR denominator)
        currentPeriodCustomers,
        // Customer yang transaksi di periode sebelumnya (untuk retention)
        prevPeriodCustomers,
      ] = await Promise.all([
        prisma.pelanggan.count({ where: customerWhere }),
        prisma.pelanggan.count({
          where: {
            ...customerWhere,
            createdAt: {
              gte: startOfDay(start),
              lte: endOfDay(end),
            },
          },
        }),
        prisma.pelanggan.aggregate({
          where: customerWhere,
          _sum: { poin: true },
        }),
        prisma.transaksi.aggregate({
          where: currentPeriodWhere,
          _count: { transaksi_id: true },
          _sum: { total: true },
        }),
        // Customer yang transaksi >= 2x di periode ini
        prisma.transaksi.groupBy({
          by: ["pelanggan_id"],
          where: currentPeriodWhere,
          having: {
            transaksi_id: { _count: { gte: 2 } },
          },
          _count: { transaksi_id: true },
        }),
        // Semua unique customer yang transaksi di periode ini
        prisma.transaksi.groupBy({
          by: ["pelanggan_id"],
          where: currentPeriodWhere,
          _count: { transaksi_id: true },
        }),
        // Semua unique customer yang transaksi di periode sebelumnya
        prisma.transaksi.groupBy({
          by: ["pelanggan_id"],
          where: prevPeriodWhere,
          _count: { transaksi_id: true },
        }),
      ]);

      // ── Retention Rate ────────────────────────────────────────────────
      const currentCustomerIds = new Set(
        currentPeriodCustomers.map((c) => c.pelanggan_id)
      );
      const prevCustomerIds = new Set(
        prevPeriodCustomers.map((c) => c.pelanggan_id)
      );

      const retainedCustomers = [...prevCustomerIds].filter((id) =>
        currentCustomerIds.has(id)
      ).length;

      const retentionRate =
        prevCustomerIds.size > 0
          ? (retainedCustomers / prevCustomerIds.size) * 100
          : 0;

      // ── Repeat Purchase Rate ──────────────────────────────────────────
      const repeatPurchaseRate =
        currentPeriodCustomers.length > 0
          ? (repeatCustomers.length / currentPeriodCustomers.length) * 100
          : 0;

      // ── CLV ───────────────────────────────────────────────────────────
      const totalRevenue = parseFloat(transactionMetrics._sum.total || 0);
      const totalTransactions = transactionMetrics._count.transaksi_id;

      const avgRevenuePerCustomer =
        totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const avgTransactionPerCustomer =
        totalCustomers > 0 ? totalTransactions / totalCustomers : 0;
      const customerLifetimeValue = avgRevenuePerCustomer * avgTransactionPerCustomer;

      return {
        totalCustomers,
        newCustomers,
        totalPoints: parseInt(totalPoints._sum.poin || 0),
        totalTransactions,
        totalRevenue,
        avgTransactionPerCustomer,
        avgRevenuePerCustomer,
        // ── Metrik baru ──
        retentionRate: parseFloat(retentionRate.toFixed(2)),
        repeatPurchaseRate: parseFloat(repeatPurchaseRate.toFixed(2)),
        customerLifetimeValue: parseFloat(customerLifetimeValue.toFixed(2)),
        // ── Info tambahan ──
        retainedCustomers,
        totalActiveCustomers: currentPeriodCustomers.length,
        totalRepeatCustomers: repeatCustomers.length,
      };
    },
    300
  );
}

  async getTopCustomers(filters) {
    const { startDate, endDate, cabangId, limit = 10 } = filters;

    const cabangIds = normalizeCabangIds(cabangId);
    const cabangFilter = buildCabangFilter(cabangIds);

    const whereClause = {
      deleted_at: null,
      status_pembayaran: "LUNAS",
      tanggal: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
      pelanggan_id: { not: null },
      ...cabangFilter,
    };

    const topCustomers = await prisma.transaksi.groupBy({
      by: ["pelanggan_id"],
      where: whereClause,
      _count: { transaksi_id: true },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: limit,
    });

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

  async getLoyaltyReport(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cabangIds = normalizeCabangIds(cabangId);
    // LoyaltyPointHistory join ke transaksi untuk filter cabang
    const cabangFilter = cabangIds
      ? {
          transaksi: {
            cabang_id:
              cabangIds.length === 1 ? cabangIds[0] : { in: cabangIds },
          },
        }
      : {};

    const cacheKey = createCacheKey(
      "loyalty:report",
      `${cabangIds ? cabangIds.join("-") : "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          createdAt: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
          ...cabangFilter,
        };

        const [pointHistory, redemptions] = await Promise.all([
          prisma.loyaltyPointHistory.aggregate({
            where: whereClause,
            _sum: { pointDidapatkan: true },
          }),
          prisma.loyaltyPointHistory.aggregate({
            where: {
              ...whereClause,
              pointDidapatkan: { lt: 0 },
            },
            _sum: { pointDidapatkan: true },
          }),
        ]);

        const totalPointsEarned = parseInt(pointHistory._sum.pointDidapatkan || 0);
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
      300
    );
  }

  async getCustomerAcquisition(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cabangIds = normalizeCabangIds(cabangId);
    const cabangFilter = buildCabangFilter(cabangIds);

    const whereClause = {
      deletedAt: null,
      status: "aktif",
      createdAt: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
      ...cabangFilter,
    };

    const customers = await prisma.pelanggan.findMany({
      where: whereClause,
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

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