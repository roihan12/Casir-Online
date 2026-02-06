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

  // Convert cabangId to PostgreSQL array format
  let cabangArray = null;
  if (cabangId && cabangId !== "all") {
    if (cabangId.includes(',')) {
      cabangArray = cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0);
    } else {
      cabangArray = [cabangId];
    }
  }

  // Build where clause for transaction list (using regular view)
  const whereClause = {
    sale_date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  if (cabangArray) {
    whereClause.cabang_id = { in: cabangArray };
  }

  // Get transactions from regular view with pagination
  const [transactions, totalCount] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT 
        transaksi_id,
        tanggal,
        sale_date,
        cabang_id,
        cabang_nama,
        pelanggan_id,
        nama_pelanggan,
        subtotal,
        diskon,
        pajak,
        biaya_tambahan,
        total,
        status_pembayaran
      FROM v_sales_report
      WHERE sale_date >= $1::date
        AND sale_date <= $2::date
        ${cabangArray ? 'AND cabang_id = ANY($3::text[])' : ''}
      ORDER BY tanggal DESC
      LIMIT $${cabangArray ? '4' : '3'} OFFSET $${cabangArray ? '5' : '4'}
    `, startDate, endDate, ...(cabangArray ? [cabangArray, limit, (page - 1) * limit] : [limit, (page - 1) * limit])),
    
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM v_sales_report
      WHERE sale_date >= $1::date
        AND sale_date <= $2::date
        ${cabangArray ? 'AND cabang_id = ANY($3::text[])' : ''}
    `, startDate, endDate, ...(cabangArray ? [cabangArray] : []))
  ]);

  // Get summary from materialized view (fast!)
  const summaryResult = await prisma.$queryRawUnsafe(`
    SELECT 
      COALESCE(SUM(total_sales), 0)::NUMERIC as total_sales,
      COALESCE(SUM(transaction_count), 0) as total_transactions,
      COALESCE(AVG(avg_transaction), 0)::NUMERIC as average_transaction,
      COALESCE(SUM(total_discount), 0)::NUMERIC as total_discount,
      COALESCE(SUM(total_tax), 0)::NUMERIC as total_tax,
      COALESCE(SUM(total_additional_fees), 0)::NUMERIC as total_additional_fees
    FROM mv_sales_daily_summary
    WHERE sale_date >= $1::date
      AND sale_date <= $2::date
      ${cabangArray ? 'AND cabang_id = ANY($3::text[])' : ''}
  `, startDate, endDate, ...(cabangArray ? [cabangArray] : []));

  const summary = summaryResult[0];

  // Get trend data from materialized view based on viewType
  let dateGroupBy;
  switch (viewType) {
    case "weekly":
      dateGroupBy = "DATE_TRUNC('week', sale_date)";
      break;
    case "monthly":
      dateGroupBy = "DATE_TRUNC('month', sale_date)";
      break;
    default: // daily
      dateGroupBy = "sale_date";
  }

  const trendData = await prisma.$queryRawUnsafe(`
    SELECT
      ${dateGroupBy} as date,
      SUM(transaction_count)::int as transactions,
      COALESCE(SUM(total_sales), 0)::NUMERIC as total
    FROM mv_sales_daily_summary
    WHERE sale_date >= $1::date
      AND sale_date <= $2::date
      ${cabangArray ? 'AND cabang_id = ANY($3::text[])' : ''}
    GROUP BY ${dateGroupBy}
    ORDER BY date ASC
  `, startDate, endDate, ...(cabangArray ? [cabangArray] : []));

  return {
    transactions,
    summary: {
      totalSales: Number(summary.total_sales) || 0,
      totalTransactions: Number(summary.total_transactions) || 0,
      averageTransaction: Number(summary.average_transaction) || 0,
      totalDiscount: Number(summary.total_discount) || 0,
      totalTax: Number(summary.total_tax) || 0,
    },
    trend: trendData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount[0]?.count || 0,
      totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
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
    // Handle comma-separated multiple cabangIds
    if (cabangId.includes(',')) {
      const cabangIds = cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0);
      whereClause.cabang_id = { in: cabangIds };
    } else {
      whereClause.cabang_id = cabangId;
    }
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
    // Handle comma-separated multiple cabangIds
    if (cabangId.includes(',')) {
      const cabangIds = cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0);
      whereClause.cabang_id = { in: cabangIds };
    } else {
      whereClause.cabang_id = cabangId;
    }
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
    // Handle comma-separated multiple cabangIds
    if (cabangId.includes(',')) {
      const cabangIds = cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0);
      whereClause.cabang_id = { in: cabangIds };
    } else {
      whereClause.cabang_id = cabangId;
    }
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
    // Handle comma-separated multiple cabangIds
    if (cabangId.includes(',')) {
      const cabangIds = cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0);
      whereClause.cabangId = { in: cabangIds };
    } else {
      whereClause.cabangId = cabangId;
    }
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
