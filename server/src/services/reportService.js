const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Report Service - Business logic for report data fetching
 */

/**
 * Get sales report data with pagination
 */
const getSalesReport = async (filters) => {
  const { startDate, endDate, cabangId, viewType, page = 1, limit = 50 } = filters;

  // Build where clause
  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    },
  };

  if (cabangId && cabangId !== "all") {
    whereClause.cabang_id = cabangId;
  }

  // Get transactions with pagination
  const [transactions, totalCount] = await Promise.all([
    prisma.transaksi.findMany({
      where: whereClause,
      include: {
        cabang: {
          select: { id: true, namaCabang: true },
        },
        pelanggan: {
          select: { id: true, namaPelanggan: true },
        },
      },
      orderBy: { tanggal: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaksi.count({ where: whereClause }),
  ]);

  // Calculate summary
  const summary = await prisma.transaksi.aggregate({
    where: whereClause,
    _count: { transaksi_id: true },
    _sum: {
      subtotal: true,
      diskon: true,
      pajak: true,
      total: true,
    },
    _avg: {
      total: true,
    },
  });

  // Get daily trend data based on viewType
  let trendData = [];

  // Build date grouping based on viewType
  let dateGroupBy;
  switch (viewType) {
    case "weekly":
      dateGroupBy = "DATE_TRUNC('week', tanggal)";
      break;
    case "monthly":
      dateGroupBy = "DATE_TRUNC('month', tanggal)";
      break;
    default: // daily
      dateGroupBy = "DATE(tanggal)";
  }

  // Build parameters for safe query
  const queryParams = [startDate, endDate];
  let cabangCondition = "";
  let cabangParamIndex = 0;

  if (cabangId && cabangId !== "all") {
    cabangCondition = "AND cabang_id = $" + (queryParams.length + 1);
    queryParams.push(cabangId);
  }

  trendData = await prisma.$queryRawUnsafe(`
    SELECT
      ${dateGroupBy} as date,
      COUNT(*) as transactions,
      COALESCE(SUM(total), 0) as total
    FROM transaksi
    WHERE deleted_at IS NULL
      AND jenis_transaksi = 'PENJUALAN'
      AND DATE(tanggal) >= $1
      AND DATE(tanggal) <= $2
      ${cabangCondition}
    GROUP BY ${dateGroupBy}
    ORDER BY date ASC
  `, queryParams);

  return {
    transactions,
    summary: {
      totalSales: Number(summary._sum.total) || 0,
      totalTransactions: summary._count.transaksi_id,
      averageTransaction: Number(summary._avg.total) || 0,
      totalDiscount: Number(summary._sum.diskon) || 0,
      totalTax: Number(summary._sum.pajak) || 0,
    },
    trend: trendData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Get sales summary metrics
 */
const getSalesSummary = async (filters) => {
  const { startDate, endDate, cabangId } = filters;

  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    },
  };

  if (cabangId && cabangId !== "all") {
    whereClause.cabang_id = cabangId;
  }

  // Get current period summary
  const currentSummary = await prisma.transaksi.aggregate({
    where: whereClause,
    _count: { transaksi_id: true },
    _sum: {
      subtotal: true,
      diskon: true,
      pajak: true,
      total: true,
    },
    _avg: {
      total: true,
    },
  });

  // Calculate previous period for comparison
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const prevStartDate = new Date(new Date(startDate).getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const prevEndDate = new Date(new Date(startDate).getTime() - 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const previousSummary = await prisma.transaksi.aggregate({
    where: {
      deleted_at: null,
      jenis_transaksi: "PENJUALAN",
      tanggal: {
        gte: new Date(prevStartDate),
        lte: new Date(prevEndDate + "T23:59:59.999Z"),
      },
      ...(cabangId && cabangId !== "all" ? { cabang_id: cabangId } : {}),
    },
    _sum: { total: true },
  });

  // Calculate growth
  const currentTotal = Number(currentSummary._sum.total) || 0;
  const previousTotal = Number(previousSummary._sum.total) || 0;
  const salesGrowth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  return {
    totalSales: currentTotal,
    totalTransactions: currentSummary._count.transaksi_id,
    averageTransaction: Number(currentSummary._avg.total) || 0,
    totalDiscount: Number(currentSummary._sum.diskon) || 0,
    totalTax: Number(currentSummary._sum.pajak) || 0,
    salesGrowth: parseFloat(salesGrowth.toFixed(2)),
    previousPeriodTotal: previousTotal,
  };
};

/**
 * Get top selling products
 */
const getTopProducts = async (filters) => {
  const { startDate, endDate, cabangId, limit = 10 } = filters;

  // Build where clause
  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    },
  };

  if (cabangId && cabangId !== "all") {
    whereClause.cabang_id = cabangId;
  }

  // Get transactions with items
  const transactions = await prisma.transaksi.findMany({
    where: whereClause,
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
    },
  });

  // Aggregate product sales
  const productSales = {};
  transactions.forEach((t) => {
    t.transaksi_detail.forEach((item) => {
      const productName = item.produk.produkMaster.namaProduk;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          quantity: 0,
          sales: 0,
        };
      }
      productSales[productName].quantity += item.jumlah;
      productSales[productName].sales += item.subtotal;
    });
  });

  // Sort by sales and get top N
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);

  return topProducts;
};

/**
 * Get sales by category
 */
const getSalesByCategory = async (filters) => {
  const { startDate, endDate, cabangId } = filters;

  // Build where clause
  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    },
  };

  if (cabangId && cabangId !== "all") {
    whereClause.cabang_id = cabangId;
  }

  // Get transactions with items
  const transactions = await prisma.transaksi.findMany({
    where: whereClause,
    include: {
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: {
                include: {
                  kategori: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Aggregate by category
  const categorySales = {};
  let totalSales = 0;

  transactions.forEach((t) => {
    t.transaksi_detail.forEach((item) => {
      const category = item.produk.produkMaster.kategori?.namaKategori || "Uncategorized";
      if (!categorySales[category]) {
        categorySales[category] = {
          name: category,
          value: 0,
        };
      }
      categorySales[category].value += item.subtotal;
      totalSales += item.subtotal;
    });
  });

  // Convert to array and calculate percentages
  const categoryData = Object.values(categorySales).map((cat) => ({
    ...cat,
    percentage: totalSales > 0 ? (cat.value / totalSales) * 100 : 0,
  }));

  // Sort by value
  categoryData.sort((a, b) => b.value - a.value);

  return {
    data: categoryData,
    total: totalSales,
  };
};

/**
 * Get inventory dashboard data
 */
const getInventoryDashboard = async (filters) => {
  const { cabangId = "all", includeLowStock = false } = filters;

  // Build where clause
  const whereClause = {
    deletedAt: null,
  };

  if (cabangId && cabangId !== "all") {
    whereClause.cabangId = cabangId;
  }

  // Get all products
  const products = await prisma.produk.findMany({
    where: whereClause,
    include: {
      produkMaster: {
        include: {
          kategori: true,
        },
      },
      cabang: true,
    },
    orderBy: {
      produkMaster: {
        namaProduk: "asc",
      },
    },
  });

  // Calculate summary metrics
  let totalProducts = products.length;
  let totalStock = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;

  const categorySummary = {};
  const branchSummary = {};

  products.forEach((p) => {
    const stok = p.stok || 0;
    const hargaBeli = Number(p.hargaBeli);
    const nilaiStok = stok * hargaBeli;

    totalStock += stok;
    totalInventoryValue += nilaiStok;

    if (p.minStok && stok <= p.minStok) {
      lowStockCount++;
    }

    // Category summary
    const category = p.produkMaster.kategori?.namaKategori || "Uncategorized";
    if (!categorySummary[category]) {
      categorySummary[category] = {
        name: category,
        productCount: 0,
        totalStock: 0,
        totalValue: 0,
      };
    }
    categorySummary[category].productCount += 1;
    categorySummary[category].totalStock += stok;
    categorySummary[category].totalValue += nilaiStok;

    // Branch summary
    const branch = p.cabang?.namaCabang || "Unknown";
    if (!branchSummary[branch]) {
      branchSummary[branch] = {
        name: branch,
        productCount: 0,
        totalStock: 0,
        totalValue: 0,
      };
    }
    branchSummary[branch].productCount += 1;
    branchSummary[branch].totalStock += stok;
    branchSummary[branch].totalValue += nilaiStok;
  });

  // Get recent inventory movements
  const movementsWhere = {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    },
  };

  if (cabangId && cabangId !== "all") {
    movementsWhere.cabangId = cabangId;
  }

  const recentMovements = await prisma.inventoryMovement.findMany({
    where: movementsWhere,
    include: {
      produk: {
        include: {
          produkMaster: true,
        },
      },
      user: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    summary: {
      totalProducts,
      totalStock,
      totalInventoryValue,
      lowStockCount,
    },
    categorySummary: Object.values(categorySummary),
    branchSummary: Object.values(branchSummary),
    recentMovements,
  };
};

/**
 * Get inventory movements
 */
const getInventoryMovements = async (filters) => {
  const InventoryReportService = require("./inventoryReportService");
  return await InventoryReportService.getInventoryMovementReport(filters);
};

/**
 * Get branch comparison data
 */
const getBranchComparison = async (filters) => {
  const { startDate, endDate } = filters;

  // Get all active branches
  const branches = await prisma.cabang.findMany({
    where: {
      status: "aktif",
      deletedAt: null,
    },
    orderBy: { namaCabang: "asc" },
  });

  // Get sales data for each branch
  const branchData = await Promise.all(
    branches.map(async (branch, index) => {
      const salesData = await prisma.transaksi.aggregate({
        where: {
          cabang_id: branch.id,
          deleted_at: null,
          jenis_transaksi: "PENJUALAN",
          tanggal: {
            gte: new Date(startDate),
            lte: new Date(endDate + "T23:59:59.999Z"),
          },
        },
        _count: { transaksi_id: true },
        _sum: { total: true },
        _avg: { total: true },
      });

      return {
        no: index + 1,
        id: branch.id,
        namaCabang: branch.namaCabang,
        alamat: branch.alamat || "-",
        totalTransaksi: salesData._count.transaksi_id || 0,
        totalPenjualan: Number(salesData._sum.total) || 0,
        rataRata: Number(salesData._avg.total) || 0,
      };
    })
  );

  // Calculate total and contribution percentage
  const grandTotal = branchData.reduce((sum, b) => sum + b.totalPenjualan, 0);
  branchData.forEach((branch) => {
    branch.kontribusi = grandTotal > 0 ? (branch.totalPenjualan / grandTotal) * 100 : 0;
  });

  // Sort by total sales
  branchData.sort((a, b) => b.totalPenjualan - a.totalPenjualan);

  return {
    branches: branchData,
    summary: {
      totalBranches: branches.length,
      grandTotalPenjualan: grandTotal,
      totalTransaksi: branchData.reduce((sum, b) => sum + b.totalTransaksi, 0),
    },
  };
};

module.exports = {
  getSalesReport,
  getSalesSummary,
  getTopProducts,
  getSalesByCategory,
  getInventoryDashboard,
  getInventoryMovements,
  getBranchComparison,
};
