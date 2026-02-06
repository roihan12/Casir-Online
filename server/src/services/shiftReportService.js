const prisma = require("../config/db");
const { cacheOrFetch, createCacheKey } = require("../utils/redisUtils");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

/**
 * Service for Shift Performance & Staff Reporting
 * Provides comprehensive shift analytics for management and audit
 */
class ShiftReportService {
  /**
   * Get shift summary metrics
   * @param {Object} filters - { startDate, endDate, cabangId, userId, status }
   * @returns {Promise<Object>} Summary metrics
   */
  async getShiftSummary(filters) {
    const { startDate, endDate, cabangId, userId, status } = filters;

    const cacheKey = createCacheKey(
      "shift:summary",
      `${cabangId || "all"}:${userId || "all"}:${status || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          deletedAt: null,
          waktuMulai: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
        };

        if (cabangId) whereClause.cabangId = cabangId;
        if (userId) whereClause.userId = userId;
        if (status) whereClause.status = status;

        // Get shift data with transactions
        const shifts = await prisma.shift.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                namaLengkap: true,
                username: true,
              },
            },
            cabang: {
              select: {
                namaCabang: true,
              },
            },
            transaksi: {
              where: { deleted_at: null },
              select: {
                total: true,
                status_pembayaran: true,
                jenis_transaksi: true,
              },
            },
          },
          orderBy: {
            waktuMulai: "desc",
          },
        });

        // Calculate metrics
        const totalShifts = shifts.length;
        const completedShifts = shifts.filter((s) => s.status === "selesai").length;
        const activeShifts = shifts.filter((s) => s.status === "aktif").length;

        let totalTransaksi = 0;
        let totalPendapatan = 0;
        let totalKasAwal = 0;
        let totalKasAkhir = 0;
        let totalSelisihKas = 0;

        shifts.forEach((shift) => {
          totalKasAwal += parseFloat(shift.kasAwal || 0);
          totalKasAkhir += parseFloat(shift.kasAkhir || 0);

          const successTransactions = shift.transaksi.filter(
            (t) => t.status_pembayaran === "lunas"
          );

          totalTransaksi += successTransactions.length;

          const shiftRevenue = successTransactions.reduce(
            (sum, t) => sum + parseFloat(t.total),
            0
          );
          totalPendapatan += shiftRevenue;

          // Calculate cash variance
          if (shift.status === "selesai") {
            const expectedCash = parseFloat(shift.kasAwal) + shiftRevenue;
            const actualCash = parseFloat(shift.kasAkhir || 0);
            totalSelisihKas += actualCash - expectedCash;
          }
        });

        const avgTransaksiPerShift =
          completedShifts > 0 ? totalTransaksi / completedShifts : 0;
        const avgPendapatanPerShift =
          completedShifts > 0 ? totalPendapatan / completedShifts : 0;

        return {
          summary: {
            totalShifts,
            completedShifts,
            activeShifts,
            totalTransaksi,
            totalPendapatan,
            avgTransaksiPerShift: Math.round(avgTransaksiPerShift),
            avgPendapatanPerShift: Math.round(avgPendapatanPerShift),
            totalKasAwal,
            totalKasAkhir,
            totalSelisihKas,
          },
          shifts: shifts.map((shift) => {
            const successTx = shift.transaksi.filter(
              (t) => t.status_pembayaran === "lunas"
            );
            const revenue = successTx.reduce(
              (sum, t) => sum + parseFloat(t.total),
              0
            );

            return {
              shiftId: shift.id,
              kasir: shift.user.namaLengkap,
              cabang: shift.cabang.namaCabang,
              waktuMulai: shift.waktuMulai,
              waktuSelesai: shift.waktuSelesai,
              status: shift.status,
              kasAwal: parseFloat(shift.kasAwal),
              kasAkhir: shift.kasAkhir ? parseFloat(shift.kasAkhir) : null,
              totalTransaksi: successTx.length,
              totalPendapatan: revenue,
              selisihKas:
                shift.status === "selesai"
                  ? parseFloat(shift.kasAkhir || 0) -
                    (parseFloat(shift.kasAwal) + revenue)
                  : null,
            };
          }),
        };
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get detailed shift information
   * @param {string} shiftId - Shift ID
   * @returns {Promise<Object>} Detailed shift data
   */
  async getShiftDetail(shiftId) {
    const cacheKey = createCacheKey("shift:detail", shiftId);

    return cacheOrFetch(
      cacheKey,
      async () => {
        const shift = await prisma.shift.findUnique({
          where: { id: shiftId },
          include: {
            user: {
              select: {
                namaLengkap: true,
                username: true,
                email: true,
              },
            },
            cabang: {
              select: {
                namaCabang: true,
                alamat: true,
              },
            },
            transaksi: {
              where: { deleted_at: null },
              include: {
                pelanggan: {
                  select: {
                    namaPelanggan: true,
                  },
                },
                pembayaran: true,
              },
              orderBy: {
                tanggal: "desc",
              },
            },
          },
        });

        if (!shift) {
          throw new Error("Shift tidak ditemukan");
        }

        // Group transactions by status
        const successTx = shift.transaksi.filter(
          (t) => t.status_pembayaran === "lunas"
        );
        const voidTx = shift.transaksi.filter((t) => t.deleted_at !== null);
        const refundTx = shift.transaksi.filter(
          (t) => t.status_pembayaran === "refund"
        );

        const totalRevenue = successTx.reduce(
          (sum, t) => sum + parseFloat(t.total),
          0
        );

        // Payment method breakdown
        const paymentBreakdown = {};
        shift.transaksi.forEach((tx) => {
          tx.pembayaran.forEach((p) => {
            const method = p.metode_pembayaran;
            if (!paymentBreakdown[method]) {
              paymentBreakdown[method] = {
                count: 0,
                total: 0,
              };
            }
            paymentBreakdown[method].count++;
            paymentBreakdown[method].total += parseFloat(p.jumlah_bayar);
          });
        });

        return {
          shift: {
            shiftId: shift.id,
            kasir: shift.user.namaLengkap,
            cabang: shift.cabang.namaCabang,
            waktuMulai: shift.waktuMulai,
            waktuSelesai: shift.waktuSelesai,
            status: shift.status,
            kasAwal: parseFloat(shift.kasAwal),
            kasAkhir: shift.kasAkhir ? parseFloat(shift.kasAkhir) : null,
            keterangan: shift.keterangan,
          },
          metrics: {
            totalTransaksi: successTx.length,
            totalVoid: voidTx.length,
            totalRefund: refundTx.length,
            totalPendapatan: totalRevenue,
            selisihKas:
              shift.status === "selesai"
                ? parseFloat(shift.kasAkhir || 0) -
                  (parseFloat(shift.kasAwal) + totalRevenue)
                : null,
          },
          paymentBreakdown,
          transactions: shift.transaksi.map((tx) => ({
            transaksiId: tx.transaksi_id,
            nomorTransaksi: tx.nomor_transaksi,
            tanggal: tx.tanggal,
            pelanggan: tx.pelanggan?.namaPelanggan || "Umum",
            total: parseFloat(tx.total),
            statusPembayaran: tx.status_pembayaran,
            jenisTransaksi: tx.jenis_transaksi,
            pembayaran: tx.pembayaran.map((p) => ({
              metodePembayaran: p.metode_pembayaran,
              jumlahBayar: parseFloat(p.jumlah_bayar),
            })),
          })),
        };
      },
      180 // 3 minutes TTL
    );
  }

  /**
   * Get cash report (variance analysis)
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Array>} Cash variance data
   */
  async getCashReport(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cacheKey = createCacheKey(
      "shift:cash",
      `${cabangId || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          deletedAt: null,
          status: "ditutup", // Only completed shifts
          waktuMulai: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
        };

        if (cabangId) whereClause.cabangId = cabangId;

        const shifts = await prisma.shift.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                namaLengkap: true,
              },
            },
            cabang: {
              select: {
                namaCabang: true,
              },
            },
            transaksi: {
              where: {
                deleted_at: null,
                status_pembayaran: "lunas",
              },
              select: {
                total: true,
              },
            },
          },
          orderBy: {
            waktuMulai: "desc",
          },
        });

        const cashReport = shifts.map((shift) => {
          const revenue = shift.transaksi.reduce(
            (sum, t) => sum + parseFloat(t.total),
            0
          );
          const expectedCash = parseFloat(shift.kasAwal) + revenue;
          const actualCash = parseFloat(shift.kasAkhir || 0);
          const variance = actualCash - expectedCash;
          const variancePercent =
            expectedCash > 0 ? (variance / expectedCash) * 100 : 0;

          return {
            shiftId: shift.id,
            kasir: shift.user.namaLengkap,
            cabang: shift.cabang.namaCabang,
            waktuMulai: shift.waktuMulai,
            waktuSelesai: shift.waktuSelesai,
            kasAwal: parseFloat(shift.kasAwal),
            totalPenjualan: revenue,
            kasSeharusnya: expectedCash,
            kasAktual: actualCash,
            selisih: variance,
            selisihPersen: variancePercent,
            status: variance === 0 ? "match" : variance > 0 ? "over" : "short",
          };
        });

        // Sort by absolute variance (biggest issues first)
        cashReport.sort((a, b) => Math.abs(b.selisih) - Math.abs(a.selisih));

        return cashReport;
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get staff performance comparison
   * @param {Object} filters - { startDate, endDate, cabangId }
   * @returns {Promise<Array>} Staff performance metrics
   */
  async getStaffPerformance(filters) {
    const { startDate, endDate, cabangId } = filters;

    const cacheKey = createCacheKey(
      "shift:staff",
      `${cabangId || "all"}:${startDate}:${endDate}`
    );

    return cacheOrFetch(
      cacheKey,
      async () => {
        const whereClause = {
          deletedAt: null,
          waktuMulai: {
            gte: startOfDay(parseISO(startDate)),
            lte: endOfDay(parseISO(endDate)),
          },
        };

        if (cabangId) whereClause.cabangId = cabangId;

        const shifts = await prisma.shift.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
                username: true,
              },
            },
            transaksi: {
              where: {
                deleted_at: null,
                status_pembayaran: "lunas",
              },
              select: {
                total: true,
                subtotal: true,
                diskon: true,
              },
            },
          },
        });

        // Group by staff
        const staffMap = new Map();

        shifts.forEach((shift) => {
          const staffKey = shift.userId;

          if (!staffMap.has(staffKey)) {
            staffMap.set(staffKey, {
              userId: shift.user.id,
              namaStaff: shift.user.namaLengkap,
              username: shift.user.username,
              totalShift: 0,
              completedShift: 0,
              totalTransaksi: 0,
              totalPendapatan: 0,
              totalDiskon: 0,
              avgTransaksiPerShift: 0,
              avgPendapatanPerShift: 0,
            });
          }

          const staff = staffMap.get(staffKey);
          staff.totalShift++;

          if (shift.status === "selesai") {
            staff.completedShift++;
          }

          const successTx = shift.transaksi;
          staff.totalTransaksi += successTx.length;

          successTx.forEach((tx) => {
            staff.totalPendapatan += parseFloat(tx.total);
            staff.totalDiskon += parseFloat(tx.diskon || 0);
          });
        });

        // Calculate averages
        const staffPerformance = Array.from(staffMap.values()).map((staff) => {
          staff.avgTransaksiPerShift =
            staff.completedShift > 0
              ? staff.totalTransaksi / staff.completedShift
              : 0;
          staff.avgPendapatanPerShift =
            staff.completedShift > 0
              ? staff.totalPendapatan / staff.completedShift
              : 0;

          return staff;
        });

        // Sort by total revenue (descending)
        staffPerformance.sort((a, b) => b.totalPendapatan - a.totalPendapatan);

        return staffPerformance;
      },
      300 // 5 minutes TTL
    );
  }
}

module.exports = new ShiftReportService();
