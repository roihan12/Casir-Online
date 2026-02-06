const prisma = require("../config/db");
const { cacheOrFetch, createCacheKey } = require("../utils/redisUtils");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

/**
 * Service for Promo & Discount Reporting
 * Provides promo effectiveness and ROI analysis
 */
class PromoReportService {
  /**
   * Get promo summary metrics
   * @param {Object} filters - { startDate, endDate, cabangId, promoId }
   * @returns {Promise<Object>} Promo summary
   */
  async getPromoSummary(filters) {
    const { startDate, endDate, cabangId, promoId } = filters;

    const cacheKey = createCacheKey(
      "promo:summary",
      `${cabangId || "all"}:${promoId || "all"}:${startDate}:${endDate}`
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

        if (promoId) whereClause.promoId = promoId;

        const promoUsage = await prisma.transaksiPromo.findMany({
          where: whereClause,
          include: {
            promo: {
              select: {
                namaPromo: true,
                kodePromo: true,
                tipeDiskon: true,
                status: true,
              },
            },
            transaksi: {
              select: {
                total: true,
                cabang_id: true,
              },
            },
          },
        });

        // Group by promo
        const promoMap = new Map();

        promoUsage.forEach((usage) => {
          if (!usage.transaksi) return; // Skip if no transaction
          
          // Filter by cabangId if specified (not "all" and not empty)
          if (cabangId && cabangId !== "all" && usage.transaksi.cabang_id !== cabangId) return;

          const promoKey = usage.promoId;

          if (!promoMap.has(promoKey)) {
            promoMap.set(promoKey, {
              promoId: usage.promoId,
              namaPromo: usage.promo.namaPromo,
              kodePromo: usage.promo.kodePromo,
              tipeDiskon: usage.promo.tipeDiskon,
              status: usage.promo.status,
              totalPenggunaan: 0,
              totalDiskon: 0,
              totalTransaksi: 0,
            });
          }

          const promo = promoMap.get(promoKey);
          promo.totalPenggunaan++;
          promo.totalDiskon += parseFloat(usage.totalDiskon);
          promo.totalTransaksi += parseFloat(usage.transaksi.total);
        });

        const result = Array.from(promoMap.values()).map((promo) => ({
          ...promo,
          avgDiskon:
            promo.totalPenggunaan > 0
              ? promo.totalDiskon / promo.totalPenggunaan
              : 0,
          roi:
            promo.totalDiskon > 0
              ? ((promo.totalTransaksi - promo.totalDiskon) / promo.totalDiskon) *
                100
              : 0,
        }));

        // Sort by usage
        result.sort((a, b) => b.totalPenggunaan - a.totalPenggunaan);

        return result;
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get promo effectiveness metrics
   * @param {string} promoId - Promo ID
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Object>} Effectiveness metrics
   */
  async getPromoEffectiveness(promoId, filters) {
    const { startDate, endDate, cabangId } = filters;

    const promo = await prisma.promoDiskon.findUnique({
      where: { id: promoId },
    });

    if (!promo) {
      throw new Error("Promo tidak ditemukan");
    }

    const whereClause = {
      promoId,
      createdAt: {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      },
    };

    const [usage, transactionStats] = await Promise.all([
      prisma.transaksiPromo.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { totalDiskon: true },
      }),
      prisma.transaksiPromo.findMany({
        where: whereClause,
        include: {
          transaksi: {
            select: {
              total: true,
              subtotal: true,
              cabang_id: true,
            },
          },
        },
      }),
    ]);

    // Filter by cabangId if specified (not "all" and not empty)
    const validTransactions = transactionStats.filter(
      (t) => t.transaksi && (!cabangId || cabangId === "all" || t.transaksi.cabang_id === cabangId)
    );

    const totalRevenue = validTransactions.reduce(
      (sum, t) => sum + parseFloat(t.transaksi.total),
      0
    );
    const totalDiscount = parseFloat(usage._sum.totalDiskon || 0);

    return {
      promo: {
        namaPromo: promo.namaPromo,
        kodePromo: promo.kodePromo,
        tipeDiskon: promo.tipeDiskon,
        status: promo.status,
      },
      metrics: {
        totalUsage: usage._count.id,
        totalDiscount,
        totalRevenue,
        avgDiscount: usage._count.id > 0 ? totalDiscount / usage._count.id : 0,
        avgTransactionValue:
          validTransactions.length > 0
            ? totalRevenue / validTransactions.length
            : 0,
        roi: totalDiscount > 0 ? ((totalRevenue - totalDiscount) / totalDiscount) * 100 : 0,
        conversionRate: promo.maxPenggunaanTotal
          ? (usage._count.id / promo.maxPenggunaanTotal) * 100
          : null,
      },
    };
  }

  /**
   * Get discount breakdown (manual vs auto vs member)
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Object>} Discount breakdown
   */
  async getDiscountBreakdown(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cacheKey = createCacheKey(
      "discount:breakdown",
      `${cabangId || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          deleted_at: null,
          status_pembayaran: "lunas",
          tanggal: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
        };

        if (cabangId) whereClause.cabang_id = cabangId;

        const [totalDiscount, promoDiscount, transactions] = await Promise.all([
          prisma.transaksi.aggregate({
            where: whereClause,
            _sum: { diskon: true },
          }),
          prisma.transaksiPromo.aggregate({
            where: {
              createdAt: {
                gte: startOfDay(parseISO(startDate)),
                lte: endOfDay(parseISO(endDate)),
              },
            },
            _sum: { totalDiskon: true },
          }),
          prisma.transaksi.findMany({
            where: whereClause,
            select: {
              diskon: true,
              pelanggan_id: true,
            },
          }),
        ]);

        const total = parseFloat(totalDiscount._sum.diskon || 0);
        const promo = parseFloat(promoDiscount._sum.totalDiskon || 0);

        // Calculate member discount (transactions with customer)
        const memberDiscount = transactions
          .filter((t) => t.pelanggan_id)
          .reduce((sum, t) => sum + parseFloat(t.diskon), 0);

        // Manual discount = total - promo
        const manual = total - promo;

        return {
          total,
          breakdown: {
            promo: {
              amount: promo,
              percentage: total > 0 ? (promo / total) * 100 : 0,
            },
            manual: {
              amount: manual,
              percentage: total > 0 ? (manual / total) * 100 : 0,
            },
            member: {
              amount: memberDiscount,
              percentage: total > 0 ? (memberDiscount / total) * 100 : 0,
            },
          },
        };
      },
      300 // 5 minutes TTL
    );
  }
}

module.exports = new PromoReportService();
