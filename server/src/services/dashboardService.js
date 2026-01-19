const prisma = require("../config/db");
const { Prisma } = require("@prisma/client");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

class DashboardService {
  // Unified dashboard data retrieval
  static async getDashboardData(user, selectedBranchId = null) {
    // For query param handling, convert string 'null' to actual null
    if (selectedBranchId === "null") {
      selectedBranchId = null;
    }

    const cacheKey = createCacheKey(
      "comprehensive-dashboard",
      `${user.id}:${selectedBranchId || "all"}`
    );
    const dashboardTTL = 300; // 5 minutes cache

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Determine user permissions and branch context
        // Note: user object is already formatted by authMiddleware, so use 'roles' and 'cabang'
        const roles = user.roles || user.userRoles || [];
        const cabangList = user.cabang || user.userCabang || [];

        const isSuperAdmin = roles.some(
          (r) => r.namaRole === "super_admin" || r.role?.namaRole === "super_admin"
        );

        // Fix branch context determination
        let branchId = null;

        if (isSuperAdmin && (!selectedBranchId || selectedBranchId === "all")) {
          branchId = "all";
        } else if (selectedBranchId) {
          // Ensure selectedBranchId is treated as a string to avoid BigInt issues
          branchId = String(selectedBranchId);
        } else {
          // Fallback to primary branch
          const primaryBranch = cabangList.find((uc) => uc.isPrimary);
          branchId = primaryBranch ? String(primaryBranch.cabangId) : null;
        }

        // Prepare dynamic filtering
        const getWhereClause = () => {
          if (isSuperAdmin && branchId === "all") return {};
          return { cabang_id: branchId };
        };

        // Parallel data fetching
        const [
          salesSummary,
          criticalAlerts,
          branchPerformance,
          productPerformance,
          staffActivity,
          revenueTimeSeries,
          averageTransactionValue,
          transactionCounts,
          categoryDistribution,
          paymentMethods,
        ] = await Promise.all([
          // Sales Summary with percentage changes
          this.fetchSalesSummary(getWhereClause()),

          // Critical Alerts
          this.fetchCriticalAlerts(branchId, isSuperAdmin),

          // Branch Performance
          this.fetchBranchPerformance(isSuperAdmin, branchId),

          // Product Performance
          this.fetchProductPerformance(branchId, isSuperAdmin),

          // Staff Activity
          this.fetchStaffActivity(branchId, isSuperAdmin),

          // Revenue Time Series
          this.fetchRevenueTimeSeries(getWhereClause()),

          // Average Transaction Value
          this.fetchAverageTransactionValue(getWhereClause()),

          // Transaction Counts
          this.fetchTransactionCounts(getWhereClause()),

          // Category Distribution
          this.fetchCategoryDistribution(branchId, isSuperAdmin),
          
          // Payment Methods
          this.fetchPaymentMethodAnalytics(branchId, isSuperAdmin),
        ]);

        // Get branch geographic data (for map view)
        const branchGeoData = isSuperAdmin
          ? await this.fetchBranchGeoData()
          : null;

        // Stock health overview
        const stockHealth = await this.fetchStockHealthOverview(
          branchId,
          isSuperAdmin
        );

        // Format the response data to handle BigInt serialization
        return this.formatResponseData({
          salesSummary,
          averageTransactionValue,
          transactionCounts,
          criticalAlerts,
          branchPerformance,
          branchGeoData,
          productPerformance,
          categoryDistribution,
          stockHealth,
          staffActivity,
          paymentMethods,
          revenueTimeSeries,
          userContext: {
            isSuperAdmin,
            accessibleBranches: cabangList.map((uc) => ({
              id: String(uc.cabangId),
              name: uc.namaCabang || uc.cabang?.namaCabang,
            })),
          },
        });
      },
      dashboardTTL
    );
  }

  // Helper method to recursively format response data and handle BigInt
  static formatResponseData(data) {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === "bigint") {
      return data.toString(); // Convert BigInt to String
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.formatResponseData(item));
    }

    if (typeof data === "object") {
      const formattedData = {};
      for (const key in data) {
        formattedData[key] = this.formatResponseData(data[key]);
      }
      return formattedData;
    }

    return data;
  }

  // Improved determineBranchContext method
  static determineBranchContext(user, selectedBranchId) {
    // Handle both formatted (roles/cabang) and raw (userRoles/userCabang) user objects
    const roles = user.roles || user.userRoles || [];
    const cabangList = user.cabang || user.userCabang || [];
    
    console.log("Roles:", roles);
    console.log("Cabang List:", cabangList);

    // Super admin can see all branches if no specific branch is selected
    const isSuperAdmin = roles.some(
      (r) => r.namaRole === "super_admin" || r.role?.namaRole === "super_admin"
    );
    
    if (isSuperAdmin && (!selectedBranchId || selectedBranchId === "all")) {
      return "all";
    }

    // When a specific branch is selected, ensure it's a string
    if (selectedBranchId) {
      return String(selectedBranchId);
    }

    // Default to primary branch
    const primaryBranch = cabangList.find((uc) => uc.isPrimary);
    return primaryBranch ? String(primaryBranch.cabangId) : null;
  }

  // Sales Summary Fetcher with percentage changes
  static async fetchSalesSummary(whereClause) {
    const [
      daily,
      prevDaily,
      weekly,
      prevWeekly,
      monthly,
      prevMonthly,
      yearly,
      prevYearly,
    ] = await Promise.all([
      this.calculateSalesSummary(whereClause, "daily"),
      this.calculateSalesSummary(whereClause, "prevDaily"),
      this.calculateSalesSummary(whereClause, "weekly"),
      this.calculateSalesSummary(whereClause, "prevWeekly"),
      this.calculateSalesSummary(whereClause, "monthly"),
      this.calculateSalesSummary(whereClause, "prevMonthly"),
      this.calculateSalesSummary(whereClause, "yearly"),
      this.calculateSalesSummary(whereClause, "prevYearly"),
    ]);

    return {
      daily: {
        ...daily,
        percentageChange: this.calculatePercentageChange(
          daily._sum.total || 0,
          prevDaily._sum.total || 0
        ),
      },
      weekly: {
        ...weekly,
        percentageChange: this.calculatePercentageChange(
          weekly._sum.total || 0,
          prevWeekly._sum.total || 0
        ),
      },
      monthly: {
        ...monthly,
        percentageChange: this.calculatePercentageChange(
          monthly._sum.total || 0,
          prevMonthly._sum.total || 0
        ),
      },
      yearly: {
        ...yearly,
        percentageChange: this.calculatePercentageChange(
          yearly._sum.total || 0,
          prevYearly._sum.total || 0
        ),
      },
    };
  }

  // Calculate percentage change
  static calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Flexible Sales Summary Calculation with expanded period options
  static async calculateSalesSummary(whereClause, period) {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));

    // Define date ranges for different periods
    const periodFilters = {
      daily: {
        startDate: today,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      prevDaily: {
        startDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        endDate: today,
      },
      weekly: {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      prevWeekly: {
        startDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      monthly: {
        startDate: new Date(new Date().setMonth(now.getMonth() - 1)),
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      prevMonthly: {
        startDate: new Date(new Date().setMonth(now.getMonth() - 2)),
        endDate: new Date(new Date().setMonth(now.getMonth() - 1)),
      },
      yearly: {
        startDate: new Date(new Date().setFullYear(now.getFullYear() - 1)),
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      prevYearly: {
        startDate: new Date(new Date().setFullYear(now.getFullYear() - 2)),
        endDate: new Date(new Date().setFullYear(now.getFullYear() - 1)),
      },
    };

    // Get date range for selected period
    const { startDate, endDate } = periodFilters[period];

    // Build the branch filter condition
    let branchCondition = "";
    if (whereClause.cabang_id) {
      branchCondition = `AND cabang_id = '${whereClause.cabang_id}'`;
    }

    // Execute raw SQL query
    const result = await prisma.$queryRaw`
    SELECT 
      SUM(total) as sum_total,
      SUM(diskon) as sum_diskon,
      COUNT(transaksi_id) as count_transaksi
    FROM transaksi
    WHERE jenis_transaksi = 'PENJUALAN'
      AND status_pembayaran = 'LUNAS'
      AND tanggal >= ${startDate}
      AND tanggal < ${endDate}
      ${
        branchCondition
          ? Prisma.sql`AND cabang_id = ${whereClause.cabang_id}`
          : Prisma.empty
      }
  `;

    console.log("DEBUG SQL", period, startDate, endDate, whereClause, result);

    // Format the result to match the original function's return structure
    // Convert BigInt values to strings
    return {
      _sum: {
        total: result[0]?.sum_total ? Number(result[0].sum_total) : 0,
        diskon: result[0]?.sum_diskon ? Number(result[0].sum_diskon) : 0,
      },
      _count: {
        transaksi_id: Number(result[0]?.count_transaksi) || 0,
      },
    };
  }

  // Transaction Counts with hourly rate
  static async fetchTransactionCounts(whereClause) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCount, todayCount, hourlyData] = await Promise.all([
      // Total transactions
      prisma.transaksi.count({
        where: {
          ...whereClause,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
        },
      }),

      // Today's transactions
      prisma.transaksi.count({
        where: {
          ...whereClause,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: today,
          },
        },
      }),

      // Hourly breakdown for today
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM tanggal) as hour, COUNT(*) as count
        FROM transaksi
        WHERE jenis_transaksi = 'PENJUALAN'
        AND status_pembayaran = 'LUNAS'
        AND tanggal >= ${today}
        ${
          whereClause.cabang_id
            ? Prisma.sql`AND cabang_id = ${whereClause.cabang_id}`
            : Prisma.empty
        }
        GROUP BY EXTRACT(HOUR FROM tanggal)
        ORDER BY hour
      `,
    ]);

    // Calculate hourly rate (average transactions per hour for today)
    const currentHour = new Date().getHours();
    const hourlyRate = currentHour > 0 ? todayCount / currentHour : todayCount;

    // Convert BigInt to Number in hourlyData
    const formattedHourlyData = hourlyData.map((item) => ({
      hour: Number(item.hour),
      count: Number(item.count),
    }));

    return {
      total: totalCount,
      today: todayCount,
      hourlyRate: parseFloat(hourlyRate.toFixed(2)),
      hourlyBreakdown: formattedHourlyData,
    };
  }

  // Average Transaction Value
  static async fetchAverageTransactionValue(whereClause) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [current, previous] = await Promise.all([
      prisma.transaksi.aggregate({
        where: {
          ...whereClause,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: today,
          },
        },
        _avg: {
          total: true,
        },
        _count: true,
      }),

      prisma.transaksi.aggregate({
        where: {
          ...whereClause,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: yesterday,
            lt: today,
          },
        },
        _avg: {
          total: true,
        },
        _count: true,
      }),
    ]);

    const currentAvg = current._avg.total || 0;
    const previousAvg = previous._avg.total || 0;
    const percentageChange = this.calculatePercentageChange(
      currentAvg,
      previousAvg
    );

    return {
      average: parseFloat(currentAvg.toFixed(2)),
      previousAverage: parseFloat(previousAvg.toFixed(2)),
      percentageChange: parseFloat(percentageChange.toFixed(2)),
      trend: percentageChange >= 0 ? "up" : "down",
    };
  }

  // Critical Alerts Fetcher
  static async fetchCriticalAlerts(branchId, isSuperAdmin) {
    const [
      lowStockProducts,
      pendingApprovals,
      expiringStock,
      unreadNotifications,
    ] = await Promise.all([
      // Low Stock Products
      prisma.produk.findMany({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          stok: { lte: prisma.produk.fields.minStok },
        },
        select: {
          id: true,
          stok: true,
          minStok: true,
          cabang: {
            select: {
              namaCabang: true,
            },
          },
          produkMaster: {
            select: {
              namaProduk: true,
            },
          },
        },
      }),

      // Pending Product Requests
      prisma.produkRequest.count({
        where: {
          status: "submitted",
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
        },
      }),

      // Expiring Stock (within 30 days)
      prisma.inventoryMovement.findMany({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          expiredDate: {
            lte: new Date(new Date().setDate(new Date().getDate() + 30)),
            gte: new Date(), // Only future expirations
          },
        },
        select: {
          produk: {
            select: {
              id: true,
              produkMaster: {
                select: {
                  namaProduk: true,
                },
              },
            },
          },
          expiredDate: true,
          batchNumber: true,
          quantity: true,
        },
        distinct: ["produkId", "batchNumber"],
      }),

      // Unread high-priority notifications
      prisma.stockNotification.count({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          isRead: false,
        },
      }),
    ]);

    // Process low stock products to include severity indicators
    const lowStockWithSeverity = lowStockProducts.map((product) => {
      const stockRatio = product.stok / product.minStok;
      let severity = "high";
      if (stockRatio >= 0.7) severity = "medium";
      else if (stockRatio >= 0.3) severity = "high";
      else severity = "critical";

      return {
        ...product,
        id: String(product.id), // Convert ID to String to avoid BigInt issues
        severity,
      };
    });

    return {
      lowStockProducts: {
        count: lowStockProducts.length,
        details: lowStockWithSeverity,
      },
      pendingApprovals,
      expiringStock: {
        count: expiringStock.length,
        details: expiringStock.map((item) => ({
          ...item,
          produk: {
            ...item.produk,
            id: String(item.produk.id), // Convert ID to String
          },
          quantity: Number(item.quantity), // Convert quantity if it's BigInt
        })),
      },
      unreadNotifications,
    };
  }

  // Rest of the methods with BigInt handling...

  // Branch Performance Fetcher with detailed information
  static async fetchBranchPerformance(isSuperAdmin, branchId) {
    if (!isSuperAdmin || branchId !== "all") {
      // If not superadmin or specific branch is selected, return minimal data
      const branchData =
        branchId !== "all"
          ? await prisma.cabang.findUnique({
              where: { id: branchId },
              select: {
                id: true,
                namaCabang: true,
                status: true,
              },
            })
          : null;

      return {
        topBranches: [],
        currentBranch: branchData
          ? {
              ...branchData,
              id: String(branchData.id), // Convert ID to String
            }
          : null,
      };
    }

    // Get branch revenue data for comparison
    const branchRevenue = await prisma.transaksi.groupBy({
      by: ["cabang_id"],
      where: {
        jenis_transaksi: "PENJUALAN",
        status_pembayaran: "LUNAS",
        tanggal: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    });

    // Get branch details for the top branches
    const branchIds = branchRevenue.map((b) => b.cabang_id);
    const branchDetails = await prisma.cabang.findMany({
      where: {
        id: { in: branchIds },
      },
      select: {
        id: true,
        namaCabang: true,
        status: true,
      },
    });

    // Get branch status indicators (all branches)
    const branchStatusMap = {};
    const allBranches = await prisma.cabang.findMany({
      select: {
        id: true,
        namaCabang: true,
        status: true,
      },
    });

    for (const branch of allBranches) {
      branchStatusMap[String(branch.id)] = branch.status;
    }

    // Combine data
    const topBranches = branchRevenue.map((b) => {
      const details = branchDetails.find((bd) => bd.id === b.cabang_id) || {};
      return {
        id: String(b.cabang_id), // Convert to String
        name: details.namaCabang,
        status: details.status,
        revenue: Number(b._sum.total), // Convert BigInt to Number
      };
    });

    return {
      topBranches,
      branchStatusMap,
    };
  }

  // Fetch Branch Geographic Data for map view
  static async fetchBranchGeoData() {
    const branches = await prisma.cabang.findMany({
      select: {
        id: true,
        namaCabang: true,
        alamat: true,
        status: true,
        latitude: true,
        longitude: true,
        _count: {
          select: {
            Transaksi: {
              where: {
                jenis_transaksi: "PENJUALAN",
                status_pembayaran: "LUNAS",
                tanggal: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                },
              },
            },
          },
        },
      },
    });

    // Convert all BigInt values to strings
    return branches.map((branch) => ({
      ...branch,
      id: String(branch.id),
      _count: {
        Transaksi: Number(branch._count.Transaksi),
      },
    }));
  }

  // Product Performance Fetcher with enhanced data
  static async fetchProductPerformance(branchId, isSuperAdmin) {
    const topProducts = await prisma.transaksiDetail.groupBy({
      by: ["produk_id"],
      where: {
        transaksi: {
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
          ...(isSuperAdmin && branchId === "all"
            ? {}
            : { cabang_id: branchId }),
        },
      },
      _sum: {
        jumlah: true,
        subtotal: true,
      },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    });

    // Get product details
    const productIds = topProducts.map((p) => p.produk_id);
    const productDetails = await prisma.produk.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        produkMaster: {
          select: {
            namaProduk: true,
            sku: true,
            kategori: {
              select: {
                namaKategori: true,
              },
            },
          },
        },
      },
    });

    // Combine the data and handle BigInt
    const enrichedTopProducts = topProducts.map((p) => {
      const details = productDetails.find((pd) => pd.id === p.produk_id) || {};
      return {
        id: String(p.produk_id), // Convert BigInt to String
        name: details.produkMaster?.namaProduk || "Unknown Product",
        sku: details.produkMaster?.sku || "",
        category:
          details.produkMaster?.kategori?.namaKategori || "Uncategorized",
        quantitySold: Number(p._sum.jumlah), // Convert BigInt to Number
        revenue: Number(p._sum.subtotal), // Convert BigInt to Number
      };
    });

    return enrichedTopProducts;
  }

  // Category Distribution Fetcher
  static async fetchCategoryDistribution(branchId, isSuperAdmin) {
    const categoryData = await prisma.$queryRaw`
      SELECT 
        k.nama_kategori as category,
        SUM(td.subtotal) as total
      FROM transaksi_detail td
      JOIN produk p ON td.produk_id = p.produk_id
      JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
      JOIN kategori k ON pm.kategori_id = k.kategori_id
      JOIN transaksi t ON td.transaksi_id = t.transaksi_id
      WHERE t.jenis_transaksi = 'PENJUALAN'
      AND t.status_pembayaran = 'LUNAS'
      AND t.tanggal >= ${new Date(
        new Date().setDate(new Date().getDate() - 30)
      )}
      ${
        !isSuperAdmin || branchId !== "all"
          ? Prisma.sql`AND t.cabang_id = ${branchId}`
          : Prisma.empty
      }
      GROUP BY k.nama_kategori
      ORDER BY total DESC
    `;

    // Calculate total for percentage calculation and handle BigInt
    const total = categoryData.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    return categoryData.map((item) => ({
      category: item.category,
      value: Number(item.total), // Convert BigInt to Number
      percentage: parseFloat(((Number(item.total) / total) * 100).toFixed(2)),
    }));
  }

  // Stock Health Overview
  static async fetchStockHealthOverview(branchId, isSuperAdmin) {
    const [totalProducts, lowStock, outOfStock, overstock] = await Promise.all([
      // Total products
      prisma.produk.count({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
        },
      }),

      // Low stock
      prisma.produk.count({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          stok: {
            lte: prisma.produk.fields.minStok,
            gt: 0,
          },
        },
      }),

      // Out of stock
      prisma.produk.count({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          stok: 0,
        },
      }),

      // Overstock
      prisma.produk.count({
        where: {
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
          stok: {
            gte: prisma.produk.fields.maxStok,
          },
          maxStok: {
            not: null,
          },
        },
      }),
    ]);

    // Calculate health percentages
    const healthyStock = totalProducts - lowStock - outOfStock - overstock;

    return {
      total: totalProducts,
      healthy: {
        count: healthyStock,
        percentage:
          totalProducts > 0 ? (healthyStock / totalProducts) * 100 : 0,
      },
      lowStock: {
        count: lowStock,
        percentage: totalProducts > 0 ? (lowStock / totalProducts) * 100 : 0,
      },
      outOfStock: {
        count: outOfStock,
        percentage: totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0,
      },
      overstock: {
        count: overstock,
        percentage: totalProducts > 0 ? (overstock / totalProducts) * 100 : 0,
      },
    };
  }

  // Staff Activity Fetcher with enhanced data
  static async fetchStaffActivity(branchId, isSuperAdmin) {
    const [activeUsers, openShifts, recentActivity] = await Promise.all([
      // Active Users with branch breakdown
      prisma.userSession.findMany({
        where: {
          user: {
            userCabang: {
              some:
                isSuperAdmin && branchId === "all"
                  ? {}
                  : { cabangId: branchId },
            },
          },
          expiredAt: { gt: new Date() },
        },
        select: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
              userCabang: {
                select: {
                  cabang: {
                    select: {
                      id: true,
                      namaCabang: true,
                    },
                  },
                },
              },
            },
          },
          lastActivity: true,
        },
      }),

      // Open Shifts with cashier details
      prisma.shift.findMany({
        where: {
          status: "dibuka",
          ...(isSuperAdmin && branchId === "all" ? {} : { cabangId: branchId }),
        },
        select: {
          id: true,
          waktuMulai: true,
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
        },
        orderBy: {
          waktuMulai: "desc",
        },
      }),

      // Recent Activity Log with user details
      prisma.auditLog.findMany({
        where: {
          ...(isSuperAdmin && branchId === "all"
            ? {}
            : { cabang_id: branchId }),
        },
        select: {
          log_id: true,
          action: true,
          table_name: true,
          created_at: true,
          user: {
            select: {
              namaLengkap: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 20,
      }),
    ]);

    // Process and format the active users data, handling BigInt
    const usersByBranch = {};
    activeUsers.forEach((session) => {
      session.user.userCabang.forEach((uc) => {
        const branchId = String(uc.cabang.id); // Convert to String
        const branchName = uc.cabang.namaCabang;

        if (!usersByBranch[branchId]) {
          usersByBranch[branchId] = {
            id: branchId,
            name: branchName,
            users: [],
          };
        }

        if (
          !usersByBranch[branchId].users.some((u) => u.id === session.user.id)
        ) {
          usersByBranch[branchId].users.push({
            id: String(session.user.id), // Convert to String
            name: session.user.namaLengkap,
            lastActivity: session.lastActivity.toISOString(),
          });
        }
      });
    });

    // Format recent activity with BigInt handling
    const formattedActivity = recentActivity.map((activity) => ({
      id: String(activity.log_id), // Convert to String
      action: activity.action,
      tableName: activity.table_name,
      timestamp:
        activity.created_at instanceof Date
          ? activity.created_at.toISOString()
          : null,
      user: activity.user?.namaLengkap || "System",
    }));

    // Format open shifts with BigInt handling
    const formattedOpenShifts = openShifts.map((shift) => ({
      id: String(shift.id), // Convert to String
      waktuMulai:
        shift.waktuMulai instanceof Date
          ? shift.waktuMulai.toISOString()
          : null,
      user: shift.user,
      cabang: shift.cabang,
    }));

    return {
      activeUsers: {
        total: activeUsers.length,
        byBranch: Object.values(usersByBranch),
      },
      openShifts: {
        count: openShifts.length,
        details: formattedOpenShifts,
      },
      recentActivity: formattedActivity,
    };
  }

  static async fetchPaymentMethodAnalytics(
    branchId = null,
    isSuperAdmin = false
  ) {
    const whereClause = {};

    // Apply branch filter if not superadmin or specific branch is selected
    if (!isSuperAdmin || (branchId && branchId !== "all")) {
      whereClause.transaksi = {
        cabang_id: branchId,
      };
    }

    // Get overall payment method breakdown across all branches (or filtered by branch)
    const globalPaymentMethods = await prisma.pembayaran.groupBy({
      by: ["metode_pembayaran", "provider"],
      where: {
        ...whereClause,
        transaksi: {
          ...whereClause.transaksi,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
          },
        },
      },
      _count: { pembayaran_id: true },
      _sum: { jumlah_bayar: true },
    });

    // Get payment methods breakdown by branch (only if superadmin and viewing all branches)
    let branchPaymentMethods = [];
    if (isSuperAdmin && branchId === "all") {
      branchPaymentMethods = await prisma.$queryRaw`
      SELECT 
        c.cabang_id,
        c.nama_cabang as cabang_name,
        p.metode_pembayaran,
        p.provider,
        COUNT(p.pembayaran_id) as count,
        SUM(p.jumlah_bayar) as total_amount
      FROM pembayaran p
      JOIN transaksi t ON p.transaksi_id = t.transaksi_id
      JOIN cabang c ON t.cabang_id = c.cabang_id
      WHERE t.jenis_transaksi = 'PENJUALAN' 
        AND t.status_pembayaran = 'LUNAS'
        AND t.tanggal >= ${new Date(
          new Date().setDate(new Date().getDate() - 30)
        )}
      GROUP BY c.cabang_id, c.nama_cabang, p.metode_pembayaran, p.provider
      ORDER BY c.nama_cabang, total_amount DESC
    `;
    }

    // Calculate trends (compare with previous 30 days)
    const previousPeriodMethods = await prisma.pembayaran.groupBy({
      by: ["metode_pembayaran"],
      where: {
        ...whereClause,
        transaksi: {
          ...whereClause.transaksi,
          jenis_transaksi: "PENJUALAN",
          status_pembayaran: "LUNAS",
          tanggal: {
            gte: new Date(new Date().setDate(new Date().getDate() - 60)), // 60 days ago
            lt: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
          },
        },
      },
      _count: { pembayaran_id: true },
      _sum: { jumlah_bayar: true },
    });

    // Process the global payment methods data
    const processedGlobalMethods = globalPaymentMethods.map((method) => {
      // Find previous period data for this method
      const previousData = previousPeriodMethods.find(
        (pm) => pm.metode_pembayaran === method.metode_pembayaran
      );

      // Calculate percentage change
      const currentAmount = Number(method._sum.jumlah_bayar);
      const previousAmount = previousData
        ? Number(previousData._sum.jumlah_bayar)
        : 0;
      const percentageChange = DashboardService.calculatePercentageChange(
        currentAmount,
        previousAmount
      );

      return {
        method: method.metode_pembayaran,
        provider: method.provider || "N/A",
        count: Number(method._count.pembayaran_id),
        amount: currentAmount,
        percentageChange,
        trend: percentageChange >= 0 ? "up" : "down",
      };
    });

    // Process branch-specific payment methods
    const processedBranchMethods = [];
    if (branchPaymentMethods.length > 0) {
      // Group by branch first
      const branchGrouped = {};

      branchPaymentMethods.forEach((item) => {
        const branchId = String(item.cabang_id);

        if (!branchGrouped[branchId]) {
          branchGrouped[branchId] = {
            id: branchId,
            name: item.cabang_name,
            methods: [],
          };
        }

        branchGrouped[branchId].methods.push({
          method: item.metode_pembayaran,
          provider: item.provider || "N/A",
          count: Number(item.count),
          amount: Number(item.total_amount),
        });
      });

      Object.values(branchGrouped).forEach((branch) => {
        // Calculate percentage distribution for this branch
        const branchTotal = branch.methods.reduce(
          (sum, method) => sum + method.amount,
          0
        );

        // Add percentage to each method
        branch.methods = branch.methods.map((method) => ({
          ...method,
          percentage:
            branchTotal > 0
              ? ((method.amount / branchTotal) * 100).toFixed(2)
              : 0,
        }));

        processedBranchMethods.push(branch);
      });
    }

    // Calculate total transaction volume and payment method distribution
    const totalVolume = processedGlobalMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    // Add percentage to global methods
    const globalMethodsWithPercentage = processedGlobalMethods.map(
      (method) => ({
        ...method,
        percentage:
          totalVolume > 0
            ? ((method.amount / totalVolume) * 100).toFixed(2)
            : 0,
      })
    );

    // Sort by amount descending
    globalMethodsWithPercentage.sort((a, b) => b.amount - a.amount);

    return {
      summary: {
        totalVolume,
        methodCount: globalMethodsWithPercentage.length,
        mostPopular:
          globalMethodsWithPercentage.length > 0
            ? globalMethodsWithPercentage[0].method
            : null,
      },
      globalMethods: globalMethodsWithPercentage,
      branchBreakdown: processedBranchMethods,
    };
  }

  // Revenue Time Series for Trend Analysis (Last 7 days)
  static async fetchRevenueTimeSeries(whereClause) {
    // Get daily data for past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Build branch condition for raw query
    const branchCondition = whereClause.cabang_id 
      ? Prisma.sql`AND cabang_id = ${whereClause.cabang_id}`
      : Prisma.empty;

    // Use raw query to get daily aggregated totals
    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE(tanggal) as date,
        SUM(total) as total
      FROM transaksi
      WHERE jenis_transaksi = 'PENJUALAN'
        AND status_pembayaran = 'LUNAS'
        AND tanggal >= ${sevenDaysAgo}
        ${branchCondition}
      GROUP BY DATE(tanggal)
      ORDER BY date ASC
    `;

    // Format data for frontend charts, handling BigInt
    const formattedData = dailyData.map((item) => ({
      date: new Date(item.date).toISOString().split("T")[0],
      total: Number(item.total) || 0,
    }));

    // Fill in missing dates with 0 values
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const existing = formattedData.find(d => d.date === dateStr);
      result.push({
        date: dateStr,
        total: existing?.total || 0,
      });
    }

    return result;
  }

  // Get active shift for kasir
  static async getActiveShift(userId, cabangId) {
    const cacheKey = createCacheKey("active-shift", `${userId}:${cabangId}`);

    // TTL pendek untuk shift aktif (1 menit)
    const shiftTTL = 60;

    return await cacheOrFetch(
      cacheKey,
      async () => {
        return prisma.shift.findFirst({
          where: {
            userId,
            cabangId,
            status: "dibuka",
          },
        });
      },
      shiftTTL
    );
  }

  // Method untuk invalidasi cache saat ada perubahan data
  static async invalidateDashboardCache(userId = null, cabangId = null) {
    if (userId && cabangId) {
      await cacheDelete(
        createCacheKey("comprehensive-dashboard", `${userId}:${cabangId}`)
      );
    } else if (userId) {
      await cacheDelete(
        createCacheKey("comprehensive-dashboard", `${userId}:*`)
      );
    } else {
      // Invalidasi semua dashboard cache jika tidak ada userId dan cabangId
      await cacheDeletePattern("comprehensive-dashboard:*");
    }
  }

  static async invalidateShiftCache(userId, cabangId) {
    await cacheDelete(createCacheKey("active-shift", `${userId}:${cabangId}`));
  }
}

module.exports = DashboardService;
