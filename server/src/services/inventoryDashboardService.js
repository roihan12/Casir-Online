const { Prisma } = require("@prisma/client");
const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

/**
 * Retrieves inventory dashboard data from the materialized view or calculates it directly if needed
 * @param {string|number} cabangId - Branch ID (null for all branches if user is super admin)
 * @param {number} period - Time period in days for data analysis (default: 30)
 * @returns {Promise<Object>} Formatted dashboard data
 */
const getInventoryDashboardData = async (cabangId, period = 30) => {
  try {
    let query;

    // Determine if we're fetching data for a specific branch or all branches
    if (cabangId && cabangId !== "all") {
      query = prisma.$queryRaw`
        SELECT 
          cabang_id,
          nama_cabang,
          CAST(total_products AS FLOAT) as total_products,
          CAST(low_stock_count AS FLOAT) as low_stock_count,
          CAST(out_of_stock_count AS FLOAT) as out_of_stock_count,
          CAST(expiring_soon_count AS FLOAT) as expiring_soon_count,
          CAST(total_stock AS FLOAT) as total_stock,
          CAST(total_value AS FLOAT) as total_value,
          CAST(movement_count_30d AS FLOAT) as movement_count_30d,
          CAST(stock_in_30d AS FLOAT) as stock_in_30d,
          CAST(stock_out_30d AS FLOAT) as stock_out_30d,
          CAST(movement_count_60d_30d AS FLOAT) as movement_count_60d_30d,
          CAST(stock_in_60d_30d AS FLOAT) as stock_in_60d_30d,
          CAST(stock_out_60d_30d AS FLOAT) as stock_out_60d_30d,
          CAST(movement_change_pct AS FLOAT) as movement_change_pct,
          CAST(stock_in_change_pct AS FLOAT) as stock_in_change_pct,
          CAST(stock_out_change_pct AS FLOAT) as stock_out_change_pct,
          CAST(total_products_change_pct AS FLOAT) as total_products_change_pct,
          CAST(low_stock_change_pct AS FLOAT) as low_stock_change_pct,
          CAST(out_of_stock_change_pct AS FLOAT) as out_of_stock_change_pct,
          CAST(branch_transfer_count AS FLOAT) as branch_transfer_count,
          CAST(branch_count AS FLOAT) as branch_count,
          last_refreshed
        FROM mv_inventory_dashboard
        WHERE cabang_id = ${cabangId}
      `;
    } else {
      query = prisma.$queryRaw`
        SELECT 
          cabang_id,
          nama_cabang,
          CAST(total_products AS FLOAT) as total_products,
          CAST(low_stock_count AS FLOAT) as low_stock_count,
          CAST(out_of_stock_count AS FLOAT) as out_of_stock_count,
          CAST(expiring_soon_count AS FLOAT) as expiring_soon_count,
          CAST(total_stock AS FLOAT) as total_stock,
          CAST(total_value AS FLOAT) as total_value,
          CAST(movement_count_30d AS FLOAT) as movement_count_30d,
          CAST(stock_in_30d AS FLOAT) as stock_in_30d,
          CAST(stock_out_30d AS FLOAT) as stock_out_30d,
          CAST(movement_count_60d_30d AS FLOAT) as movement_count_60d_30d,
          CAST(stock_in_60d_30d AS FLOAT) as stock_in_60d_30d,
          CAST(stock_out_60d_30d AS FLOAT) as stock_out_60d_30d,
          CAST(movement_change_pct AS FLOAT) as movement_change_pct,
          CAST(stock_in_change_pct AS FLOAT) as stock_in_change_pct,
          CAST(stock_out_change_pct AS FLOAT) as stock_out_change_pct,
          CAST(total_products_change_pct AS FLOAT) as total_products_change_pct,
          CAST(low_stock_change_pct AS FLOAT) as low_stock_change_pct,
          CAST(out_of_stock_change_pct AS FLOAT) as out_of_stock_change_pct,
          CAST(branch_transfer_count AS FLOAT) as branch_transfer_count,
          CAST(branch_count AS FLOAT) as branch_count,
          last_refreshed
        FROM mv_inventory_dashboard
      `;
    }

    const viewData = await query;

    // Process data to handle BigInt conversions before returning
    if (!viewData || viewData.length === 0) {
      console.warn(
        "No data found in inventory_dashboard_view, falling back to direct calculation"
      );
      return await calculateDashboardData(cabangId, period);
    }

    // Convert BigInt values to regular numbers
    const processedData = viewData.map((row) => {
      const processed = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "bigint") {
          processed[key] = safeBigIntToNumber(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });

    // Process each branch's data or return a single branch's data
    if (cabangId && cabangId !== "all") {
      // Return data for a specific branch
      return formatDashboardData(processedData[0], period);
    } else {
      // Return aggregated data for all branches
      return formatAggregatedDashboardData(processedData, period);
    }
  } catch (error) {
    console.error("Error getting inventory dashboard data:", error);
    // Fallback to direct calculation for any error
    return await calculateDashboardData(cabangId, period);
  }
};

const inventoryNewDashboardData = async (cabangId, period = "7days") => {
  try {
  
    const stockMenipis = await prisma.$queryRaw`
      SELECT 
      produk_id,
      cabang_id,
      nama_cabang,
      nama_produk,
      sku,
      barcode,
      stok,
      min_stok,
      max_stok,
      CAST(harga_beli AS FLOAT) as harga_beli,
      CAST(harga_jual AS FLOAT) as harga_jual,
      status,
      is_low_stock,
      stok_status,
      updated_at,
      CAST(stok_percentage AS INTEGER) as stok_percentage
        from get_produk_stok_menipis(${cabangId ? cabangId : null}::TEXT, ${period}::TEXT) order by updated_at desc limit 10`


    const produkKedaluwarsa = await prisma.$queryRaw`
      SELECT
        produk_id,
        cabang_id,
        nama_cabang,
        nama_produk,
        sku,
        barcode,
        stok,
        tanggal_kedaluwarsa,
        CAST(harga_jual AS FLOAT) as harga_jual,
        status,
        tanggal_sekarang,
        CAST(hari_tersisa AS INTEGER) as hari_tersisa,
        status_kadaluarsa
        from get_produk_akan_kadaluarsa(${cabangId ? cabangId : null}::TEXT, ${period}::TEXT)`

       const transferAntaraCabang = await prisma.$queryRaw`
      SELECT
      transfer_id,
      nomor_transfer,
      cabang_asal,
      cabang_tujuan,
      tanggal_kirim,
      tanggal_terima,
      status,
keterangan,
created_at,
updated_at,
created_by_name,
CAST(jumlah_item AS INTEGER) as jumlah_item,
CAST(total_barang_kirim AS INTEGER) as total_barang_kirim,
CAST(total_barang_terima AS INTEGER) as total_barang_terima,
total_barang_terima,
status_text,
status_style  from get_transfer_antar_cabang(${cabangId ? cabangId : null}::TEXT, ${period}::TEXT)`
      

    const [stockMenipisData, produkKedaluwarsaData, transferAntaraCabangData] = await Promise.all([
      stockMenipis,
      produkKedaluwarsa,
      transferAntaraCabang
    ]);
    // Menggabungkan data dari kedua query
    const combinedData = {
      stockMenipis: stockMenipisData,
      produkKedaluwarsa: produkKedaluwarsaData,
      transferAntaraCabang: transferAntaraCabangData
    }

    return combinedData;
  } catch (error) {
    console.error("Error getting inventory dashboard data:", error);
    throw new ResponseError(500, "Internal Server Error");
  }
}

  


/**
 * Formats dashboard data for a single branch
 * @param {Object} viewData - Raw data from the materialized view
 * @param {number} period - Time period in days
 * @returns {Object} Formatted dashboard data
 */
const formatDashboardData = (viewData, period) => {
  // Default to current data regardless of period for now
  // In the future, could add different time ranges to the materialized view

  return {
    summaryData: {
      totalProduk: viewData.total_products,
      stokRendah: viewData.low_stock_count,
      habisStok: viewData.out_of_stock_count,
      kadaluwarsa30Hari: viewData.expiring_soon_count,
      nilaiInventori: viewData.total_value, // Already converted by our preprocessing
      totalStok: viewData.total_stock,
    },
    movementData: {
      pergerakanStok: {
        total: viewData.movement_count_30d,
        perubahan: viewData.movement_change_pct,
      },
      stokMasuk: {
        total: viewData.stock_in_30d,
        perubahan: viewData.stock_in_change_pct,
      },
      stokKeluar: {
        total: viewData.stock_out_30d,
        perubahan: viewData.stock_out_change_pct,
      },
      transferCabang: {
        total: viewData.branch_transfer_count,
        cabangTerhubung: viewData.branch_count,
      },
    },
    changeData: {
      totalProdukPerubahan: viewData.total_products_change_pct,
      stokRendahPerubahan: viewData.low_stock_change_pct,
      habisStokPerubahan: viewData.out_of_stock_change_pct,
    },
    metadata: {
      lastRefreshed: new Date(viewData.last_refreshed),
      branchId: viewData.cabang_id,
      branchName: viewData.nama_cabang,
    },
  };
};

/**
 * Formats aggregated dashboard data for all branches
 * @param {Array<Object>} viewDataArray - Raw data from the materialized view for all branches
 * @param {number} period - Time period in days
 * @returns {Object} Aggregated dashboard data
 */
const formatAggregatedDashboardData = (viewDataArray, period) => {
  // Initialize aggregation objects
  const aggregated = {
    totalProduk: 0,
    stokRendah: 0,
    habisStok: 0,
    kadaluwarsa30Hari: 0,
    nilaiInventori: 0,
    totalStok: 0,
    movementCount: 0,
    stockIn: 0,
    stockOut: 0,
    transferCount: 0,
    branchCount: new Set(), // Use Set to avoid duplicate counts
    branches: [],
  };

  // Calculate weighted change percentages
  let weightedMovementChangePct = 0;
  let weightedStockInChangePct = 0;
  let weightedStockOutChangePct = 0;
  let weightedTotalProductsChangePct = 0;
  let weightedLowStockChangePct = 0;
  let weightedOutOfStockChangePct = 0;
  let totalMovementWeight = 0;
  let totalStockInWeight = 0;
  let totalStockOutWeight = 0;
  let totalProductsWeight = 0;
  let lowStockWeight = 0;
  let outOfStockWeight = 0;

  // Process each branch
  viewDataArray.forEach((branch) => {
    // Add to aggregated totals
    aggregated.totalProduk += branch.total_products;
    aggregated.stokRendah += branch.low_stock_count;
    aggregated.habisStok += branch.out_of_stock_count;
    aggregated.kadaluwarsa30Hari += branch.expiring_soon_count;
    aggregated.nilaiInventori += branch.total_value; // Already converted to Number
    aggregated.totalStok += branch.total_stock;
    aggregated.movementCount += branch.movement_count_30d;
    aggregated.stockIn += branch.stock_in_30d;
    aggregated.stockOut += branch.stock_out_30d;
    aggregated.transferCount += branch.branch_transfer_count;

    // Track unique connected branches
    if (branch.branch_count > 0) {
      for (let i = 0; i < branch.branch_count; i++) {
        aggregated.branchCount.add(branch.cabang_id);
      }
    }

    // Store branch data for potential drill-down
    aggregated.branches.push({
      id: branch.cabang_id,
      name: branch.nama_cabang,
      totalProducts: branch.total_products,
      lowStock: branch.low_stock_count,
      outOfStock: branch.out_of_stock_count,
      totalValue: branch.total_value,
    });

    // Calculate weighted change percentages
    // Only include in average if the base value existed
    if (branch.movement_count_60d_30d > 0) {
      weightedMovementChangePct +=
        branch.movement_change_pct * branch.movement_count_30d;
      totalMovementWeight += branch.movement_count_30d;
    }

    if (branch.stock_in_60d_30d > 0) {
      weightedStockInChangePct +=
        branch.stock_in_change_pct * branch.stock_in_30d;
      totalStockInWeight += branch.stock_in_30d;
    }

    if (branch.stock_out_60d_30d > 0) {
      weightedStockOutChangePct +=
        branch.stock_out_change_pct * branch.stock_out_30d;
      totalStockOutWeight += branch.stock_out_30d;
    }

    weightedTotalProductsChangePct +=
      branch.total_products_change_pct * branch.total_products;
    totalProductsWeight += branch.total_products;

    weightedLowStockChangePct +=
      branch.low_stock_change_pct * branch.low_stock_count;
    lowStockWeight += branch.low_stock_count;

    weightedOutOfStockChangePct +=
      branch.out_of_stock_change_pct * branch.out_of_stock_count;
    outOfStockWeight += branch.out_of_stock_count;
  });

  // Calculate final weighted averages
  const movementChangePct =
    totalMovementWeight > 0
      ? weightedMovementChangePct / totalMovementWeight
      : 0;
  const stockInChangePct =
    totalStockInWeight > 0 ? weightedStockInChangePct / totalStockInWeight : 0;
  const stockOutChangePct =
    totalStockOutWeight > 0
      ? weightedStockOutChangePct / totalStockOutWeight
      : 0;
  const totalProductsChangePct =
    totalProductsWeight > 0
      ? weightedTotalProductsChangePct / totalProductsWeight
      : 0;
  const lowStockChangePct =
    lowStockWeight > 0 ? weightedLowStockChangePct / lowStockWeight : 0;
  const outOfStockChangePct =
    outOfStockWeight > 0 ? weightedOutOfStockChangePct / outOfStockWeight : 0;

  // Return formatted aggregated data
  return {
    summaryData: {
      totalProduk: aggregated.totalProduk,
      stokRendah: aggregated.stokRendah,
      habisStok: aggregated.habisStok,
      kadaluwarsa30Hari: aggregated.kadaluwarsa30Hari,
      nilaiInventori: aggregated.nilaiInventori,
      totalStok: aggregated.totalStok,
    },
    movementData: {
      pergerakanStok: {
        total: aggregated.movementCount,
        perubahan: parseFloat(movementChangePct.toFixed(2)),
      },
      stokMasuk: {
        total: aggregated.stockIn,
        perubahan: parseFloat(stockInChangePct.toFixed(2)),
      },
      stokKeluar: {
        total: aggregated.stockOut,
        perubahan: parseFloat(stockOutChangePct.toFixed(2)),
      },
      transferCabang: {
        total: aggregated.transferCount,
        cabangTerhubung: aggregated.branchCount.size,
      },
    },
    changeData: {
      totalProdukPerubahan: parseFloat(totalProductsChangePct.toFixed(2)),
      stokRendahPerubahan: parseFloat(lowStockChangePct.toFixed(2)),
      habisStokPerubahan: parseFloat(outOfStockChangePct.toFixed(2)),
    },
    metadata: {
      lastRefreshed: new Date(viewDataArray[0]?.last_refreshed || Date.now()),
      branchCount: viewDataArray.length,
      branches: aggregated.branches,
    },
  };
};

/**
 * Safely converts BigInt values to regular JavaScript numbers
 * @param {any} value - Value to convert
 * @returns {number} Converted number
 */
const safeBigIntToNumber = (value) => {
  if (typeof value === "bigint") {
    return Number(value.toString());
  }
  return Number(value);
};
const calculateDashboardData = async (cabangId, period = 30) => {
  console.log(
    `Fallback: calculating dashboard data directly for branch ${cabangId} over ${period} days period`
  );

  try {
    // Define where clause for branch filtering
    const branchWhere =
      cabangId && cabangId !== "all" ? { cabang_id: cabangId } : {};

    // Current period date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - period);

    // Previous period date range (for comparisons)
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - period);

    // Parallel queries
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      expiringProducts,
      totalValue,
      currentMovements,
      previousMovements,
      branchTransfers,
    ] = await Promise.all([
      // Total products
      prisma.produk.count({
        where: {
          ...branchWhere,
          status: "tersedia",
        },
      }),

      // Low stock products
      prisma.produk.count({
        where: {
          ...branchWhere,
          status: "tersedia",
          stok: {
            gt: 0,
            lte: prisma.raw("min_stok"),
          },
        },
      }),

      // Out of stock products
      prisma.produk.count({
        where: {
          ...branchWhere,
          status: "tersedia",
          stok: 0,
        },
      }),

      // Products expiring in the next 30 days
      prisma.produk.count({
        where: {
          ...branchWhere,
          status: "tersedia",
          tanggal_kedaluwarsa: {
            gt: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 30)),
          },
        },
      }),

      // Calculate total inventory value
      prisma.produk
        .aggregate({
          where: {
            ...branchWhere,
            status: "tersedia",
          },
          _sum: {
            stok: true,
          },
          _count: {
            produk_id: true,
          },
        })
        .then(async (result) => {
          // We also need to calculate the total value
          const valueResult = await prisma.withRls(tx => tx.$queryRaw`
          SELECT CAST(SUM(stok * harga_beli) AS FLOAT) as total_value
          FROM produk
          WHERE status = 'tersedia'
          ${
            cabangId && cabangId !== "all"
              ? prisma.sql`AND cabang_id = ${cabangId}`
              : prisma.sql``
          }
        `);

          return {
            totalStok: result._sum.stok || 0,
            totalValue: valueResult[0]?.total_value || 0,
          };
        }),

      // Current period movement data
      prisma.inventory_movement
        .groupBy({
          by: ["cabang_id"],
          where: {
            ...branchWhere,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: {
            _all: true,
          },
          _sum: {
            quantity: true,
          },
        })
        .then((results) => {
          // Process movement data
          const movementData = {
            count: 0,
            stockIn: 0,
            stockOut: 0,
          };

          results.forEach((branch) => {
            movementData.count += branch._count._all;

            // Need to recalculate stock in/out as we have net values
            const stockInOut = branch._sum.quantity || 0;
            if (stockInOut > 0) {
              movementData.stockIn += stockInOut;
            } else {
              movementData.stockOut += Math.abs(stockInOut);
            }
          });

          return movementData;
        }),

      // Previous period movement data (for comparison)
      prisma.inventory_movement
        .groupBy({
          by: ["cabang_id"],
          where: {
            ...branchWhere,
            created_at: {
              gte: prevStartDate,
              lte: prevEndDate,
            },
          },
          _count: {
            _all: true,
          },
          _sum: {
            quantity: true,
          },
        })
        .then((results) => {
          const movementData = {
            count: 0,
            stockIn: 0,
            stockOut: 0,
          };

          results.forEach((branch) => {
            movementData.count += branch._count._all;

            const stockInOut = branch._sum.quantity || 0;
            if (stockInOut > 0) {
              movementData.stockIn += stockInOut;
            } else {
              movementData.stockOut += Math.abs(stockInOut);
            }
          });

          return movementData;
        }),

      // Branch transfers
      prisma.stock_transfer
        .groupBy({
          by: ["cabang_asal_id"],
          where: {
            OR: [
              {
                cabang_asal_id:
                  cabangId && cabangId !== "all" ? cabangId : undefined,
              },
              {
                cabang_tujuan_id:
                  cabangId && cabangId !== "all" ? cabangId : undefined,
              },
            ],
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: {
            transfer_id: true,
          },
        })
        .then((results) => {
          let totalTransfers = 0;
          const uniqueBranches = new Set();

          results.forEach((result) => {
            totalTransfers += result._count.transfer_id;
            uniqueBranches.add(result.cabang_asal_id);
          });

          return {
            transferCount: totalTransfers,
            branchCount: uniqueBranches.size,
          };
        }),
    ]);

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    const movementChangePercent = calculatePercentageChange(
      currentMovements.count,
      previousMovements.count
    );

    const stockInChangePercent = calculatePercentageChange(
      currentMovements.stockIn,
      previousMovements.stockIn
    );

    const stockOutChangePercent = calculatePercentageChange(
      currentMovements.stockOut,
      previousMovements.stockOut
    );

    // Return formatted data
    return {
      summaryData: {
        totalProduk: totalProducts,
        stokRendah: lowStockProducts,
        habisStok: outOfStockProducts,
        kadaluwarsa30Hari: expiringProducts,
        nilaiInventori: totalValue.totalValue,
        totalStok: totalValue.totalStok,
      },
      movementData: {
        pergerakanStok: {
          total: currentMovements.count,
          perubahan: movementChangePercent,
        },
        stokMasuk: {
          total: currentMovements.stockIn,
          perubahan: stockInChangePercent,
        },
        stokKeluar: {
          total: currentMovements.stockOut,
          perubahan: stockOutChangePercent,
        },
        transferCabang: {
          total: branchTransfers.transferCount,
          cabangTerhubung: branchTransfers.branchCount,
        },
      },
      // We can't easily calculate these in the fallback mode - would require more queries
      changeData: {
        totalProdukPerubahan: 0,
        stokRendahPerubahan: 0,
        habisStokPerubahan: 0,
      },
      metadata: {
        lastRefreshed: new Date(),
        calculationMethod: "direct", // Flag that we didn't use the materialized view
      },
    };
  } catch (error) {
    console.error("Error in calculateDashboardData:", error);
    // Return minimal data to avoid breaking the UI
    return {
      summaryData: {
        totalProduk: 0,
        stokRendah: 0,
        habisStok: 0,
        kadaluwarsa30Hari: 0,
        nilaiInventori: 0,
        totalStok: 0,
      },
      movementData: {
        pergerakanStok: { total: 0, perubahan: 0 },
        stokMasuk: { total: 0, perubahan: 0 },
        stokKeluar: { total: 0, perubahan: 0 },
        transferCabang: { total: 0, cabangTerhubung: 0 },
      },
      changeData: {
        totalProdukPerubahan: 0,
        stokRendahPerubahan: 0,
        habisStokPerubahan: 0,
      },
      metadata: {
        lastRefreshed: new Date(),
        error: true,
      },
    };
  }
};

/**
 * Calculate dashboard data directly from database tables
 * This is a fallback if the materialized view is not available
 */
const calculateDashboardData2 = async (cabangId, period = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  // 1. Total produk
  const totalProducts = await prisma.produk.count({
    where: {
      cabangId: cabangId,
      status: "tersedia",
    },
  });

  // 2. Stok rendah - Fix for prisma.raw issue
  const lowStockCount = await prisma.withRls(tx => tx.$queryRaw`
    SELECT COUNT(*) as count 
    FROM produk 
    WHERE cabang_id = ${cabangId} 
    AND status = 'tersedia' 
    AND stok <= min_stok 
    AND stok > 0
  `);

  // 3. Habis stok
  const outOfStockCount = await prisma.produk.count({
    where: {
      cabangId: cabangId,
      status: "tersedia",
      stok: 0,
    },
  });

  // 4. Kadaluwarsa < 30 hari
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  // Use findMany with distinct to get unique products, then count them
  const expiringProducts = await prisma.inventoryMovement.findMany({
    where: {
      cabangId: cabangId,
      expiredDate: {
        not: null,
        lte: expiryDate,
        gt: new Date(),
      },
    },
    select: {
      produkId: true,
    },
    distinct: ["produkId"],
  });

  const expiringCount = expiringProducts.length;

  // 5. Nilai inventori
  const inventoryValue = await prisma.withRls(tx => tx.$queryRaw`
    SELECT SUM(harga_beli * stok) as total_value
    FROM produk
    WHERE cabang_id = ${cabangId}
    AND status = 'tersedia'
  `);

  // 6. Pergerakan stok 30 hari terakhir
  const stockMovements = await prisma.inventoryMovement.count({
    where: {
      cabangId: cabangId,
      createdAt: {
        gte: startDate,
      },
    },
  });

  // 7. Stok masuk 30 hari terakhir
  const stockIn = await prisma.inventoryMovement.aggregate({
    where: {
      cabangId: cabangId,
      quantity: {
        gt: 0,
      },
      createdAt: {
        gte: startDate,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  // 8. Stok keluar 30 hari terakhir
  const stockOut = await prisma.inventoryMovement.aggregate({
    where: {
      cabangId: cabangId,
      quantity: {
        lt: 0,
      },
      createdAt: {
        gte: startDate,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  // 9. Transfer antar cabang
  const branchTransfers = await prisma.stockTransfer.count({
    where: {
      OR: [{ cabangAsalId: cabangId }, { cabangTujuanId: cabangId }],
      createdAt: {
        gte: startDate,
      },
    },
  });

  // 10. Persentase perubahan dari bulan lalu
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - period);

  // Previous period stock movements
  const previousStockMovements = await prisma.inventoryMovement.count({
    where: {
      cabangId: cabangId,
      createdAt: {
        gte: previousStartDate,
        lt: startDate,
      },
    },
  });

  // Calculate percentage changes with null check
  const stockMovementChange =
    previousStockMovements > 0
      ? Math.round(
          ((stockMovements - previousStockMovements) / previousStockMovements) *
            100
        )
      : 0;

  // Previous period stock in
  const previousStockIn = await prisma.inventoryMovement.aggregate({
    where: {
      cabangId: cabangId,
      quantity: {
        gt: 0,
      },
      createdAt: {
        gte: previousStartDate,
        lt: startDate,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const stockInChange =
    (previousStockIn._sum?.quantity || 0) > 0
      ? Math.round(
          (((stockIn._sum?.quantity || 0) -
            (previousStockIn._sum?.quantity || 0)) /
            (previousStockIn._sum?.quantity || 1)) *
            100
        )
      : 0;

  // Previous period stock out
  const previousStockOut = await prisma.inventoryMovement.aggregate({
    where: {
      cabangId: cabangId,
      quantity: {
        lt: 0,
      },
      createdAt: {
        gte: previousStartDate,
        lt: startDate,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  // Handle null values properly in stock out calculations
  const currentStockOutValue = Math.abs(stockOut._sum?.quantity || 0);
  const previousStockOutValue = Math.abs(previousStockOut._sum?.quantity || 0);

  const stockOutChange =
    previousStockOutValue > 0
      ? Math.round(
          ((currentStockOutValue - previousStockOutValue) /
            previousStockOutValue) *
            100
        )
      : 0;

  // Compile all data
  return {
    summaryData: {
      totalProduk: totalProducts,
      stokRendah: Number(lowStockCount[0]?.count || 0),
      habisStok: outOfStockCount,
      kadaluwarsa30Hari: expiringCount,
      nilaiInventori: Number(inventoryValue[0]?.total_value || 0),
    },
    movementData: {
      pergerakanStok: {
        total: stockMovements,
        perubahan: stockMovementChange,
      },
      stokMasuk: {
        total: stockIn._sum?.quantity || 0,
        perubahan: stockInChange,
      },
      stokKeluar: {
        total: currentStockOutValue,
        perubahan: stockOutChange,
      },
      transferCabang: {
        total: branchTransfers,
      },
    },
  };
};

/**
 * Get low stock products
 */
const getLowStockProducts = async (cabangId, period = '30days', page = 1, limit = 10) => {
  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;
  
  // Get total count of low stock products
  const totalQuery = await prisma.$queryRaw`
    SELECT COUNT(*) as total 
    FROM get_produk_stok_menipis(${cabangId === 'all' ? null : cabangId}::TEXT, ${period}::TEXT)`;
  
  // Get paginated results
  const stockMenipis = await prisma.$queryRaw`
    SELECT 
      produk_id as id,
      cabang_id,
      nama_cabang,
      nama_produk,
      sku,
      barcode,
      stok,
      min_stok as stok_minimum,
      max_stok,
      CAST(harga_beli AS FLOAT) as harga_beli,
      CAST(harga_jual AS FLOAT) as harga_jual,
      status,
      is_low_stock,
      stok_status,
      updated_at,
      CAST(stok_percentage AS INTEGER) as stok_percentage
    FROM get_produk_stok_menipis(${cabangId === 'all' ? null : cabangId}::TEXT, ${period}::TEXT) 
    ORDER BY updated_at DESC 
    LIMIT ${limit} OFFSET ${offset}`;

  const total = Number(totalQuery[0]?.total || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data: stockMenipis,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};


const getStockKadaluwarsa = async (cabangId, period = '30days', page = 1, limit = 10) => {
  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;
  
  // Get total count of low stock products
  const totalQuery = await prisma.$queryRaw`
    SELECT COUNT(*) as total 
    FROM get_produk_akan_kadaluarsa(${cabangId ? cabangId : null}::TEXT, ${period}::TEXT)`;
  

    const produkKedaluwarsa = await prisma.$queryRaw`
      SELECT
        produk_id,
        cabang_id,
        nama_cabang,
        nama_produk,
        sku,
        barcode,
        stok,
        tanggal_kedaluwarsa,
        CAST(harga_jual AS FLOAT) as harga_jual,
        status,
        tanggal_sekarang,
        CAST(hari_tersisa AS INTEGER) as hari_tersisa,
        status_kadaluarsa
        from get_produk_akan_kadaluarsa(${cabangId ? cabangId : null}::TEXT, ${period}::TEXT) ORDER BY tanggal_kedaluwarsa DESC 
    LIMIT ${limit} OFFSET ${offset}`;

    const total = Number(totalQuery[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: produkKedaluwarsa,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
};

/**
 * Get stock movement data
 */
/**
 * Get stock movement data for the inventory dashboard
 * @param {string|number} cabangId - Branch ID (null for all branches if user is super admin)
 * @param {number|string} period - Time period in days or a specific interval ('7days', '30days', '90days')
 * @param {string} interval - Interval for grouping data ('day', 'week', 'month')
 * @returns {Promise<Object>} Stock movement data
 */
const getHighStockMovementData = async (cabangId, period = 30, interval = 'day') => {
  try {
    // Convert period to days if it's a string format like '7days'
    let days = period;
    if (typeof period === 'string') {
      const match = period.match(/^(\d+)days$/);
      if (match) {
        days = parseInt(match[1], 10);
      }
    }

    // Calculate start date based on period
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Format dates for SQL query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Query the stock movement data using the SQL function
    const movementData = await prisma.$queryRaw`
      SELECT * FROM get_pergerakan_stok(
        ${cabangId !== 'all' ? cabangId : null}::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::VARCHAR,
        ${formattedStartDate}::DATE,
        ${formattedEndDate}::DATE,
        ${interval}::TEXT
      )
    `;

    // Get top products with highest movement
    const topProducts = await prisma.$queryRaw`
      SELECT * FROM get_produk_pergerakan_tertinggi(
        ${cabangId !== 'all' ? cabangId : null}::TEXT,
        NULL::TEXT,
        ${formattedStartDate}::DATE,
        ${formattedEndDate}::DATE,
        10,
        'total'
      ) order by total_pergerakan desc
    `;

    // Process data to handle BigInt conversions
    const processedMovementData = movementData.map(row => {
      const processed = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          processed[key] = safeBigIntToNumber(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });

    const processedTopProducts = topProducts.map(row => {
      const processed = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          processed[key] = safeBigIntToNumber(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });

    // Format the response
    return {
      movementTrends: processedMovementData,
      topProducts: processedTopProducts
    };
  } catch (error) {
    console.error('Error getting stock movement data:', error);
    throw new ResponseError(500, 'Failed to retrieve stock movement data');
  }
};

/**
 * Get inventory activity data
 * @param {string|number} cabangId - Branch ID (null for all branches if user is super admin)
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Array>} Recent inventory activities
 */
const getInventoryActivities = async (cabangId, limit = 50) => {
  try {
    // Query recent inventory activities using the SQL function
    const activities = await prisma.$queryRaw`
      SELECT * FROM get_aktivitas_inventori(
        ${cabangId !== 'all' ? cabangId : null}::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        (CURRENT_TIMESTAMP - INTERVAL '30 days')::TIMESTAMP,
        CURRENT_TIMESTAMP::TIMESTAMP,
        ${limit}::INTEGER
      )
    `;

    // Process data to handle BigInt conversions
    const processedActivities = activities.map(row => {
      const processed = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          processed[key] = safeBigIntToNumber(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });

    return processedActivities;
  } catch (error) {
    console.error('Error getting inventory activities:', error);
    throw new ResponseError(500, 'Failed to retrieve inventory activities');
  }
};

/**
 * Get inventory value by category
 * @param {string|number} cabangId - Branch ID (null for all branches if user is super admin)
 * @returns {Promise<Array>} Inventory value data by category
 */
const getInventoryValueByCategory = async (cabangId) => {
  try {
    // Query inventory value by category using the SQL function
    const inventoryValue = await prisma.$queryRaw`
      SELECT * FROM vw_nilai_inventori_kategori
      ${cabangId ? Prisma.sql`WHERE cabang_id = ${cabangId}` : Prisma.sql``}
    `;

    // Process data to handle BigInt conversions
    const processedInventoryValue = inventoryValue.map(row => {
      const processed = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          processed[key] = safeBigIntToNumber(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });

    return processedInventoryValue;
  } catch (error) {
    console.error('Error getting inventory value by category:', error);
    throw new ResponseError(500, 'Failed to retrieve inventory value by category');
  }
};

/**
 * Get stock movement data for the inventory dashboard
 * @param {string|number} cabangId - Branch ID (null for all branches if user is super admin)
 * @param {number} period - Time period in days for data analysis
 * @returns {Promise<Object>} Formatted stock movement data
 */
const getStockMovementData = async (cabangId, period = 30, interval = 'day') => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Use the SQL function to get stock movement data
    let movementData;
    
    if (cabangId && cabangId !== "all") {
      // Query for specific branch using the SQL function
      movementData = await prisma.$queryRaw`
        SELECT * FROM get_pergerakan_stok(
          ${cabangId}::TEXT, 
          NULL::TEXT, 
          NULL::TEXT, 
          NULL::TEXT,
          NULL::VARCHAR,
          ${startDate}::DATE, 
          ${endDate}::DATE, 
          'day'
        )
      `;
    } else {
      // Query for all branches using the SQL function
      movementData = await prisma.$queryRaw`
        SELECT * FROM get_pergerakan_stok(
        ${cabangId !== 'all' ? cabangId : null}::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::VARCHAR,
        ${startDate}::DATE,
        ${endDate}::DATE,
        ${interval}::TEXT
      )
      `;
    }

    // Get category-based movement data using the SQL view
    const categoryMovementData = await prisma.$queryRaw`
      SELECT 
        nama_kategori as name,
        SUM(stok_masuk) as incoming,
        SUM(stok_keluar) as outgoing,
        SUM(perubahan_bersih) as net_change
      FROM vw_pergerakan_stok_kategori
      WHERE bulan >= ${startDate}::DATE
      ${cabangId && cabangId !== "all" ? Prisma.sql`AND cabang_id = ${cabangId}` : Prisma.sql``}
      GROUP BY nama_kategori
      ORDER BY SUM(stok_masuk + stok_keluar) DESC
      LIMIT 10
    `;

    // Process and format the data
    const formattedData = {
      summary: {
        totalMovements: 0,
        totalIncoming: 0,
        totalOutgoing: 0,
        netChange: 0,
      },
      categories: [],
      dailyTrend: [],
    };

    // Format daily trend data
    const dailyData = {};
    movementData.forEach(row => {
      const date = row.periode;
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          incoming: 0,
          outgoing: 0,
          netChange: 0,
        };
      }
      
      dailyData[date].incoming += Number(row.stok_masuk) || 0;
      dailyData[date].outgoing += Number(row.stok_keluar) || 0;
      dailyData[date].netChange += Number(row.perubahan_bersih) || 0;
      
      // Update summary totals
      formattedData.summary.totalIncoming += Number(row.stok_masuk) || 0;
      formattedData.summary.totalOutgoing += Number(row.stok_keluar) || 0;
      formattedData.summary.netChange += Number(row.perubahan_bersih) || 0;
      formattedData.summary.totalMovements += Number(row.jumlah_transaksi) || 0;
    });
    
    // Convert daily data object to array and sort by date
    formattedData.dailyTrend = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Format category data
    formattedData.categories = categoryMovementData.map(category => ({
      name: category.name,
      incoming: Number(category.incoming) || 0,
      outgoing: Number(category.outgoing) || 0,
      netChange: Number(category.net_change) || 0,
    }));

    return formattedData;
  } catch (error) {
    console.error("Error getting stock movement data:", error);
    throw new ResponseError(500, "Failed to get stock movement data");
  }
};

/**
 * Get stock value
 */
const getStockValue = async (cabangId) => {
  if (!cabangId) {
    throw new ResponseError(400, "Cabang ID is required");
  }

  // Calculate total inventory value
  const inventoryValue = await prisma.produk.aggregate({
    where: {
      cabangId: cabangId,
      status: "tersedia",
    },
    _sum: {
      stok: true,
    },
    _count: {
      id: true,
    },
  });

  // Calculate total value (hargaBeli * stok)
  const totalValue = await prisma.withRls(tx => tx.$queryRaw`
    SELECT SUM(harga_beli * stok) as total_value
    FROM produk
    WHERE cabang_id = ${cabangId}
    AND status = 'tersedia'
  `);

  return {
    totalProducts: inventoryValue._count.id,
    totalStock: inventoryValue._sum.stok || 0,
    totalValue: totalValue[0]?.total_value || 0,
  };
};

/**
 * Get branch transfer data
 */
/**
 * Retrieves branch transfer data for the specified branch and time period
 * @param {string} [cabangId] - The branch ID to filter by (optional)
 * @param {number} [period=7] - Number of days to look back (default: 7)
 * @returns {Promise<Array>} Array of branch transfer records
 * @throws {ResponseError} If there's an error fetching the data
 */
const getBranchTransferData = async (cabangId, period = 7) => {
  try {
    // Input validation
    if (period <= 0) {
      throw new Error('Period must be a positive number');
    }
    
    // Convert period to string with 'days' suffix for the database function
    const periodString = `${period}days`;
    
    const branchTransferData = await prisma.$queryRaw`
      SELECT 
        transfer_id,
        nomor_transfer,
        cabang_asal,
        cabang_tujuan,
        tanggal_kirim,
        tanggal_terima,
        status,
        keterangan,
        created_at,
        updated_at,
        created_by_name,
        CAST(jumlah_item AS INTEGER) as jumlah_item,
        CAST(total_barang_kirim AS INTEGER) as total_barang_kirim,
        CAST(total_barang_terima AS INTEGER) as total_barang_terima,
        status_text,
        status_style
      FROM get_transfer_antar_cabang(
        ${cabangId || null}::TEXT, 
        ${periodString}::TEXT
      )
    `;

    return branchTransferData;
  } catch (error) {
    console.error("Error in getBranchTransferData:", error);
    
    // Check if it's a known error type
    if (error instanceof Error) {
      throw new ResponseError(400, `Invalid input: ${error.message}`);
    }
    
    // Database or other internal error
    throw new ResponseError(
      500, 
      "Gagal mengambil data transfer antar cabang. Silakan coba beberapa saat lagi."
    );
  }
};


const getInventoryHealthScore = async (cabangId) => {
  try {
    const inventoryHealthScore = await prisma.$queryRaw`
      SELECT 
        cabang_id,
        nama_cabang,
        CAST(total_products AS INTEGER) as total_products,
        CAST(avg_stock_level_score AS INTEGER) as avg_stock_level_score,
        CAST(avg_expiration_score AS INTEGER) as avg_expiration_score,
        CAST(avg_movement_score AS INTEGER) as avg_movement_score,
        CAST(avg_financial_score AS INTEGER) as avg_financial_score,
        CAST(avg_overall_health_score AS INTEGER) as avg_overall_health_score,
        branch_health_status,
        CAST(products_needing_attention AS INTEGER) as products_needing_attention,
        CAST(healthy_products_percentage AS INTEGER) as healthy_products_percentage
      FROM view_branch_inventory_health_score
      ${cabangId ? Prisma.sql`WHERE cabang_id = ${cabangId}` : Prisma.sql``}
    `;

    return inventoryHealthScore;
  } catch (error) {
    console.error("Error getting inventory health score:", error);
    throw new ResponseError(500, "Failed to retrieve inventory health score");
  }
};






module.exports = {
  getInventoryDashboardData,
  getLowStockProducts,
  getStockMovementData,
  getStockValue,
  getBranchTransferData,
  inventoryNewDashboardData,
  getInventoryActivities,
  getInventoryValueByCategory,
  getHighStockMovementData,
  getInventoryHealthScore,
  getStockKadaluwarsa,
};
