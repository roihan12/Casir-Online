const prisma = require("../config/db");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

/**
 * Service untuk mengelola data dashboard produk
 */
class ProductDashboardService {
  /**
   * Mendapatkan semua data dashboard produk
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getProductDashboardData(cabangId = null) {
    const cacheKey = createCacheKey(
      "product-dashboard-data",
      cabangId || "all"
    );
    const cacheTTL = 300; // 5 menit
  
    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Query materialized views for dashboard data
        const cabangFilter = cabangId ? { cabang_id: cabangId } : { cabang_id: 'all' };
  
        // Get summary data from materialized view
        const summaryData = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_summary 
          WHERE cabang_id = ${cabangFilter.cabang_id}
        `;
  
        // Get attribute data from materialized view
        const attributeData = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_attributes 
          WHERE cabang_id = ${cabangFilter.cabang_id}
        `;
  
        // Get top products from materialized view
        const topProducts = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_top_products 
          WHERE cabang_id = ${cabangFilter.cabang_id}
          LIMIT 5
        `;
  
        // Get product distribution from materialized view
        const productDistribution = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_distribution 
          WHERE cabang_id = ${cabangFilter.cabang_id}
          ORDER BY jumlah_produk DESC
          LIMIT 10
        `;
  
        // Get product profitability from materialized view
        const productProfitability = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_profitability 
          WHERE cabang_id = ${cabangFilter.cabang_id}
          LIMIT 10
        `;
  
        // Get category performance from materialized view
        const categoryPerformance = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_category_performance 
          WHERE cabang_id = ${cabangFilter.cabang_id}
          LIMIT 10
        `;
  
        const stockTurnover = await prisma.$queryRaw`
          SELECT * FROM mv_product_dashboard_stock_turnover 
          WHERE cabang_id = ${cabangFilter.cabang_id}
          LIMIT 10
        `;
        
        // For data that isn't in materialized views, we can still use the original methods
        const [
          newMasterProducts,
          newBranchProducts,
          salesTrend,
          productRecommendations,
        ] = await Promise.all([
          this.getNewMasterProducts(),
          this.getNewBranchProducts(cabangId),
          this.getProductSalesTrend(cabangId, 6, 5),
          this.getProductRecommendations(cabangId),
        ]);
  
        // Helper function to convert BigInt values
        const convertBigIntToNumber = (obj) => {
          if (obj === null || obj === undefined) {
            return obj;
          }
          
          if (typeof obj === 'bigint') {
            return Number(obj.toString());
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => convertBigIntToNumber(item));
          }
          
          if (typeof obj === 'object') {
            const result = {};
            for (const key in obj) {
              result[key] = convertBigIntToNumber(obj[key]);
            }
            return result;
          }
          
          return obj;
        };
  
        // Convert BigInt values in all data objects
        const processedSummaryData = convertBigIntToNumber(summaryData);
        const processedAttributeData = convertBigIntToNumber(attributeData);
        const processedTopProducts = convertBigIntToNumber(topProducts);
        const processedProductDistribution = convertBigIntToNumber(productDistribution);
        const processedProductProfitability = convertBigIntToNumber(productProfitability);
        const processedCategoryPerformance = convertBigIntToNumber(categoryPerformance);
        const processedStockTurnover = convertBigIntToNumber(stockTurnover);
  
        // Format the response to match the original structure
        return {
          summaryData: {
            totalProduct: {
              total: processedSummaryData[0].total_products,
              active: processedSummaryData[0].total_products - processedSummaryData[0].inactive_products,
              inactive: processedSummaryData[0].inactive_products,
            },
            stockLow: {
              count: processedSummaryData[0].stock_low_count,
            },
            stockOut: {
              count: processedSummaryData[0].stock_out_count,
            },
            categories: {
              count: processedSummaryData[0].total_categories,
            },
            inventoryValue: processedSummaryData[0].inventory_value,
          },
          attributeData: {
            sku: { count: processedAttributeData[0].with_sku },
            barcode: { count: processedAttributeData[0].with_barcode },
            description: { count: processedAttributeData[0].with_description },
          },
          imageData: {
            withImages: { count: processedAttributeData[0].with_images },
            withoutImages: { count: processedAttributeData[0].without_images },
          },
          specificationData: {
            withWeight: { count: processedAttributeData[0].with_weight },
            withDimension: { count: processedAttributeData[0].with_dimension },
          },
          statusData: {
            active: { count: processedSummaryData[0].total_products - processedSummaryData[0].inactive_products },
            inactive: { count: processedSummaryData[0].inactive_products },
          },
          topProducts: processedTopProducts.map(p => ({
            id: p.produk_master_id,
            sku: p.sku,
            namaProduk: p.nama_produk,
            kategori: p.nama_kategori ? {
              id: p.kategori_id,
              namaKategori: p.nama_kategori,
            } : null,
            gambar: p.gambar,
            stok: p.total_stok,
            satuan: p.satuan,
            totalTerjual: p.total_terjual,
            terjual30Hari: p.total_terjual,
            cabangId: p.cabang_id,
          })),
          newProducts: {
            master: newMasterProducts,
            branch: newBranchProducts,
          },
          productDistribution: processedProductDistribution.map(p => ({
            id: p.kategori_id,
            namaKategori: p.nama_kategori,
            jumlahProduk: p.jumlah_produk,
          })),
          // Business insights section
          businessInsights: {
            profitability: processedProductProfitability.map(p => ({
              id: p.id,
              produkMasterId: p.produk_master_id,
              namaProduk: p.nama_produk,
              sku: p.sku,
              kategori: p.kategori || 'Tidak ada kategori',
              cabang: p.cabang,
              hargaBeli: p.harga_beli,
              hargaJual: p.harga_jual,
              margin: p.margin,
              marginPercentage: parseFloat(p.margin_percentage.toFixed(2)),
              totalSold: p.total_sold,
              totalRevenue: p.total_revenue,
              totalProfit: p.total_profit,
              roi: parseFloat(p.roi.toFixed(2)),
            })),
            stockTurnover: processedStockTurnover,
            categoryPerformance: processedCategoryPerformance,
            salesTrend,
            productRecommendations,
          },
        };
      },
      cacheTTL
    );
  }

  // Implement a method to refresh materialized views
  static async refreshMaterializedViews() {
    try {
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_summary`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_attributes`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_top_products`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_distribution`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_profitability`;
      
      // Also invalidate the cache
      await this.invalidateProductDashboardCache();
      
      return { success: true, message: "Materialized views refreshed successfully" };
    } catch (error) {
      console.error("Error refreshing materialized views:", error);
      return { success: false, message: "Failed to refresh materialized views", error };
    }
  }

  /**
   * Mendapatkan jumlah total produk
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getTotalProduct(cabangId = null) {
    if (cabangId) {
      // Jika cabangId diberikan, hitung produk di cabang tersebut
      const result = await prisma.produk.findMany({
        where: {
          cabangId,
          produkMaster: {
            deletedAt: null,
          },
        },
        include: {
          produkMaster: {
            select: {
              status: true,
            },
          },
        },
      });

      const active = result.filter(
        (p) => p.produkMaster.status === "aktif"
      ).length;
      const inactive = result.filter(
        (p) => p.produkMaster.status === "nonaktif"
      ).length;

      return {
        total: active + inactive,
        active,
        inactive,
        percentage:
          active + inactive > 0 ? (active / (active + inactive)) * 100 : 0,
      };
    } else {
      // Jika tidak ada cabangId, hitung semua produk di seluruh cabang
      // dan breakdown per cabang
      
      // 1. Dapatkan semua produk dengan cabang dan status
      const allProducts = await prisma.produk.findMany({
        include: {
          produkMaster: {
            select: {
              status: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
        },
        where: {
          produkMaster: {
            deletedAt: null,
          },
        },
      });
      
      // 2. Hitung total produk aktif dan nonaktif
      const active = allProducts.filter(
        (p) => p.produkMaster.status === "aktif"
      ).length;
      const inactive = allProducts.filter(
        (p) => p.produkMaster.status === "nonaktif"
      ).length;
      
      // 3. Breakdown per cabang
      const branchBreakdown = {};
      
      allProducts.forEach(product => {
        const cabangId = product.cabang.id;
        const status = product.produkMaster.status;
        
        if (!branchBreakdown[cabangId]) {
          branchBreakdown[cabangId] = {
            cabangId,
            namaCabang: product.cabang.namaCabang,
            total: 0,
            active: 0,
            inactive: 0,
          };
        }
        
        branchBreakdown[cabangId].total++;
        
        if (status === "aktif") {
          branchBreakdown[cabangId].active++;
        } else if (status === "nonaktif") {
          branchBreakdown[cabangId].inactive++;
        }
      });
      
      // 4. Konversi ke array dan tambahkan persentase
      const branchesData = Object.values(branchBreakdown).map(branch => ({
        ...branch,
        percentage: branch.total > 0 ? (branch.active / branch.total) * 100 : 0,
      }));
      
      // 5. Urutkan berdasarkan total produk (terbanyak dulu)
      branchesData.sort((a, b) => b.total - a.total);

      return {
        total: active + inactive,
        active,
        inactive,
        percentage:
          active + inactive > 0 ? (active / (active + inactive)) * 100 : 0,
        branches: branchesData,
      };
    }
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getStockLow(cabangId = null) {
    const whereClause = {
      stok: {
        gt: 0,
        lte: 10, // Threshold stok rendah, bisa disesuaikan
      },
    };

    if (cabangId) {
      whereClause.cabangId = cabangId;
    }

    // Ambil produk dengan stok rendah
    const products = await prisma.produk.count({
      where: whereClause,
    });

    return {
      count: products,
    };
  }

  /**
   * Mendapatkan produk dengan stok habis
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getStockOut(cabangId = null) {
    const whereClause = {
      stok: 0,
    };

    if (cabangId) {
      whereClause.cabangId = cabangId;
    }

    // Ambil produk dengan stok 0
    const products = await prisma.produk.count({
      where: whereClause,
    });

    return {
      count: products,
    };
  }

  /**
   * Mendapatkan jumlah kategori dan rata-rata produk per kategori
   */
  static async getCategories() {
    // Hitung jumlah kategori
    const totalCategories = await prisma.kategori.count({
      where: {
        deletedAt: null,
      },
    });

    // Hitung jumlah produk
    const totalProducts = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
      },
    });

    // Hitung rata-rata produk per kategori
    const avgProductsPerCategory =
      totalCategories > 0 ? totalProducts / totalCategories : 0;

    return {
      count: totalCategories,
      avgProductsPerCategory: parseFloat(avgProductsPerCategory.toFixed(1)),
    };
  }

  /**
   * Mendapatkan produk dengan gambar
   */
  static async getProductsWithImages() {
    // Produk dengan minimal 1 gambar
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        produkImage: {
          some: {},
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk tanpa gambar
   */
  static async getProductsWithoutImages() {
    // Produk tanpa gambar
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        produkImage: {
          none: {},
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk dengan deskripsi
   */
  static async getProductsWithDescription() {
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        deskripsi: {
          not: "",
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk dengan SKU
   */
  static async getProductsWithSku() {
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        sku: {
          not: "",
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk dengan barcode
   */
  static async getProductsWithBarcode() {
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        barcode: {
          not: "",
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk dengan berat
   */
  static async getProductsWithWeight() {
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        berat: {
          not: null,
        },
      },
    });

    return { count };
  }

  /**
   * Mendapatkan produk dengan dimensi
   */
  static async getProductsWithDimension() {
    const count = await prisma.produkMaster.count({
      where: {
        deletedAt: null,
        OR: [
          {
            dimensiP: {
              not: null,
            },
          },
          {
            dimensiL: {
              not: null,
            },
          },
          {
            dimensiT: {
              not: null,
            },
          },
        ],
      },
    });

    return { count };
  }

    /**
   * Mendapatkan produk terlaris berdasarkan penjualan
   * @param {Number} limit - Batas jumlah produk yang akan diambil
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
    static async getTopProducts(limit = 5, cabangId = null) {
      // Tanggal untuk filter 30 hari terakhir
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Query dasar untuk transaksi detail
      const transactionWhereClause = {
        transaksi: {
          tanggal: {
            gte: thirtyDaysAgo
          }
        }
      };
      
      // Filter berdasarkan cabang jika cabangId ada
      if (cabangId) {
        transactionWhereClause.produk = {
          cabangId: cabangId
        };
      }
      
      // Dapatkan produk dengan penjualan terbanyak dalam 30 hari terakhir
      const topSellingProducts = await prisma.transaksiDetail.groupBy({
        by: ['produk_id'],
        where: transactionWhereClause,
        _sum: {
          jumlah: true
        },
        orderBy: {
          _sum: {
            jumlah: 'desc'
          }
        },
        take: limit * 2 // Ambil lebih banyak untuk antisipasi filter
      });
      
      // Jika tidak ada produk yang terjual, ambil produk terbaru
      if (topSellingProducts.length === 0) {
        // Query untuk produk master
        const productQuery = {
          where: {
            deletedAt: null,
          },
          include: {
            kategori: {
              select: {
                id: true,
                namaKategori: true,
              },
            },
            produkImage: {
              where: {
                isPrimary: true,
              },
              take: 1,
            },
            produk: {
              select: {
                id: true,
                stok: true,
                hargaJual: true,
                cabangId: true,
                transaksiDetail: {
                  select: {
                    jumlah: true,
                    transaksi: {
                      select: {
                        tanggal: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        };
        
        // Filter berdasarkan cabang jika cabangId ada
        if (cabangId) {
          productQuery.include.produk.where = {
            cabangId: cabangId,
          };
        }
        
        const newProducts = await prisma.produkMaster.findMany(productQuery);
        
        return newProducts
          .filter(product => {
            // Filter produk yang tidak memiliki data di cabang yang diminta
            if (cabangId) {
              return product.produk.length > 0;
            }
            return true;
          })
          .map(product => {
            // Filter produk berdasarkan cabang jika cabangId ada
            const filteredProduk = cabangId
              ? product.produk // produk sudah difilter pada query
              : product.produk;
              
            // Total stok
            const totalStok = filteredProduk.reduce(
              (sum, p) => sum + (p.stok || 0),
              0
            );
            
            return {
              id: product.id,
              sku: product.sku,
              namaProduk: product.namaProduk,
              kategori: product.kategoriId
                ? {
                    id: product.kategoriId,
                    namaKategori: product.kategori.namaKategori,
                  }
                : null,
              gambar:
                product.produkImage.length > 0
                  ? product.produkImage[0].filePath
                  : null,
              stok: totalStok,
              satuan: product.satuan,
              totalTerjual: 0,
              terjual30Hari: 0,
              cabangId: cabangId || "all",
              isNew: true, // Tandai sebagai produk baru
            };
          })
          .slice(0, limit);
      }
      
      // Ambil detail produk master untuk produk-produk terlaris
      const productIds = topSellingProducts.map(p => {
        // Dapatkan produk master ID dari produk ID
        return prisma.produk.findUnique({
          where: { id: p.produk_id },
          select: { produkMasterId: true }
        });
      });
      
      const productMasterIds = (await Promise.all(productIds))
        .filter(p => p !== null)
        .map(p => p.produkMasterId);
      
      // Ambil detail lengkap produk master
      const topProducts = await prisma.produkMaster.findMany({
        where: {
          id: { in: productMasterIds },
          deletedAt: null,
        },
        include: {
          kategori: {
            select: {
              id: true,
              namaKategori: true,
            },
          },
          produkImage: {
            where: {
              isPrimary: true,
            },
            take: 1,
          },
          produk: {
            select: {
              id: true,
              stok: true,
              hargaJual: true,
              cabangId: true,
              transaksiDetail: {
                select: {
                  jumlah: true,
                  transaksi: {
                    select: {
                      tanggal: true,
                    },
                  },
                },
              },
            },
            ...(cabangId ? { where: { cabangId } } : {}),
          },
        },
      });
      
      // Hitung total penjualan dan format data
      return topProducts
        .filter(product => {
          // Filter produk yang tidak memiliki data di cabang yang diminta
          if (cabangId) {
            return product.produk.length > 0;
          }
          return true;
        })
        .map((product) => {
          // Filter produk berdasarkan cabang jika cabangId ada
          const filteredProduk = product.produk;
  
          // Total penjualan
          const totalSold = filteredProduk.reduce(
            (sum, p) =>
              sum + p.transaksiDetail.reduce((total, td) => total + td.jumlah, 0),
            0
          );
  
          // Total penjualan 30 hari terakhir
          const recentSold = filteredProduk.reduce(
            (sum, p) =>
              sum +
              p.transaksiDetail.reduce(
                (total, td) =>
                  td.transaksi.tanggal >= thirtyDaysAgo
                    ? total + td.jumlah
                    : total,
                0
              ),
            0
          );
  
          // Total stok
          const totalStok = filteredProduk.reduce(
            (sum, p) => sum + (p.stok || 0),
            0
          );
  

          let productBranchId = cabangId;
          if (!cabangId && filteredProduk.length > 0) {
            // Find the branch with highest sales
            const branchSales = {};
            filteredProduk.forEach(p => {
              if (!branchSales[p.cabangId]) {
                branchSales[p.cabangId] = 0;
              }
              branchSales[p.cabangId] += p.transaksiDetail.reduce((total, td) => total + td.jumlah, 0);
            });
            
            // Get branch with highest sales
            const topBranch = Object.entries(branchSales)
              .sort((a, b) => b[1] - a[1])[0];
            
            productBranchId = topBranch ? topBranch[0] : filteredProduk[0].cabangId;
          }
          return {
            id: product.id,
            sku: product.sku,
            namaProduk: product.namaProduk,
            kategori: product.kategoriId
              ? {
                  id: product.kategoriId,
                  namaKategori: product.kategori.namaKategori,
                }
              : null,
            gambar:
              product.produkImage.length > 0
                ? product.produkImage[0].filePath
                : null,
            stok: totalStok,
            satuan: product.satuan,
            totalTerjual: totalSold,
            terjual30Hari: recentSold,
            cabangId: productBranchId,
          };
        })
        .sort((a, b) => b.terjual30Hari - a.terjual30Hari) // Urutkan berdasarkan penjualan 30 hari terakhir
        .slice(0, limit);
    }

  /**
   * Mendapatkan produk master baru yang ditambahkan oleh super admin
   * @param {Number} limit - Batas jumlah produk yang akan diambil
   */
  static async getNewMasterProducts(limit = 5) {
    const newProducts = await prisma.produkMaster.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        kategori: {
          select: {
            id: true,
            namaKategori: true,
          },
        },
        produkImage: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        _count: {
          select: {
            produk: true, // Hitung jumlah produk di cabang
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Ambil berdasarkan tanggal pembuatan terbaru
      },
      take: limit,
    });

    return newProducts.map((product) => ({
      id: product.id,
      sku: product.sku,
      namaProduk: product.namaProduk,
      kategori: product.kategori
        ? {
            id: product.kategori.id,
            namaKategori: product.kategori.namaKategori,
          }
        : null,
      gambar:
        product.produkImage.length > 0 ? product.produkImage[0].filePath : null,
      satuan: product.satuan,
      jumlahCabang: product._count.produk, // Jumlah cabang yang memiliki produk ini
      tanggalDibuat: product.createdAt,
    }));
  }

  /**
   * Mendapatkan produk baru yang ditambahkan di cabang
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   * @param {Number} limit - Batas jumlah produk yang akan diambil
   */
  static async getNewBranchProducts(cabangId = null, limit = 5) {
    const whereClause = {};
    if (cabangId) {
      whereClause.cabangId = cabangId;
    }

    const newProducts = await prisma.produk.findMany({
      where: whereClause,
      include: {
        produkMaster: {
          include: {
            kategori: {
              select: {
                id: true,
                namaKategori: true,
              },
            },
            produkImage: {
              where: {
                isPrimary: true,
              },
              take: 1,
            },
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Ambil berdasarkan tanggal pembuatan terbaru
      },
      take: limit,
    });

    return newProducts.map((product) => ({
      id: product.id,
      produkMasterId: product.produkMasterId,
      sku: product.produkMaster.sku,
      namaProduk: product.produkMaster.namaProduk,
      kategori: product.produkMaster.kategori
        ? {
            id: product.produkMaster.kategori.id,
            namaKategori: product.produkMaster.kategori.namaKategori,
          }
        : null,
      gambar:
        product.produkMaster.produkImage.length > 0
          ? product.produkMaster.produkImage[0].filePath
          : null,
      satuan: product.produkMaster.satuan,
      cabang: {
        id: product.cabang.id,
        namaCabang: product.cabang.namaCabang,
      },
      hargaJual: product.hargaJual,
      stok: product.stok,
      tanggalDibuat: product.createdAt,
    }));
  }

  /**
   * Mendapatkan nilai inventori total atau per cabang
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getInventoryValue(cabangId = null) {
    let whereClause = {};
    if (cabangId) {
      whereClause.cabangId = cabangId;
    }

    // Jika ada cabangId, hitung nilai inventori hanya untuk cabang tersebut
    // Jika tidak, hitung untuk semua cabang
    const products = await prisma.produk.findMany({
      where: whereClause,
      select: {
        stok: true,
        hargaBeli: true,
        cabangId: true,
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
    });

    // Hitung nilai total inventori
    const totalValue = products.reduce(
      (sum, product) => sum + product.stok * product.hargaBeli.toNumber(),
      0
    );

    // Jika ada filter cabang, kembalikan hanya nilai total
    if (cabangId) {
      return {
        totalValue,
        cabangId,
        cabangName: products[0]?.cabang?.namaCabang || "Unknown",
      };
    }

    // Jika tidak ada filter, hitung nilai per cabang
    const cabangValues = {};
    products.forEach((product) => {
      const nilai = product.stok * product.hargaBeli.toNumber();
      const cabangId = product.cabangId;

      if (!cabangValues[cabangId]) {
        cabangValues[cabangId] = {
          cabangId,
          cabangName: product.cabang.namaCabang,
          value: 0,
        };
      }

      cabangValues[cabangId].value += nilai;
    });

    return {
      totalValue,
      perCabang: Object.values(cabangValues).sort((a, b) => b.value - a.value),
    };
  }

  /**
   * Mendapatkan distribusi produk berdasarkan kategori
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getProductDistribution(cabangId = null) {
    if (cabangId) {
      // Distribusi produk per kategori untuk satu cabang
      const products = await prisma.produk.findMany({
        where: {
          cabangId,
        },
        include: {
          produkMaster: {
            include: {
              kategori: true,
            },
          },
        },
      });

      // Hitung jumlah produk per kategori
      const categoryCount = {};
      products.forEach((product) => {
        const kategori = product.produkMaster.kategori;
        if (kategori) {
          const kategoriId = kategori.id;
          if (!categoryCount[kategoriId]) {
            categoryCount[kategoriId] = {
              id: kategoriId,
              namaKategori: kategori.namaKategori,
              jumlahProduk: 0,
            };
          }
          categoryCount[kategoriId].jumlahProduk++;
        }
      });

      // Urutkan dan ambil 10 kategori teratas
      return Object.values(categoryCount)
        .sort((a, b) => b.jumlahProduk - a.jumlahProduk)
        .slice(0, 10);
    } else {
      // Distribusi global
      const productsByCategory = await prisma.kategori.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              produkMaster: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: {
          produkMaster: {
            _count: "desc",
          },
        },
        take: 10, // Ambil 10 kategori teratas
      });

      return productsByCategory.map((category) => ({
        id: category.id,
        namaKategori: category.namaKategori,
        jumlahProduk: category._count.produkMaster,
      }));
    }
  }

  /**
   * Mendapatkan data warning untuk produk
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
  static async getProductWarningData(cabangId = null) {
    const whereClause = {
      stok: 0,
    };

    if (cabangId) {
      whereClause.cabangId = cabangId;
    }

    // Produk dengan stok habis, join dengan ProdukMaster untuk mendapatkan detail produk
    const stockOut = await prisma.produk.findMany({
      where: whereClause,
      select: {
        id: true,
        stok: true,
        cabangId: true,
        cabang: {
          select: {
            namaCabang: true,
          },
        },
        produkMaster: {
          select: {
            id: true,
            namaProduk: true,
            sku: true,
            satuan: true,
          },
        },
      },
      take: 10,
    });

    // Untuk contoh, tidak ada data produk termahal
    const noData = {
      message: "Belum ada data produk",
    };

    // Format data untuk respons
    const formattedStockOut = stockOut.map((item) => ({
      id: item.produkMaster.id,
      produkId: item.id,
      namaProduk: item.produkMaster.namaProduk,
      sku: item.produkMaster.sku,
      stok: item.stok,
      satuan: item.produkMaster.satuan,
      cabangId: item.cabangId,
      cabangNama: item.cabang.namaCabang,
    }));

    return {
      stockOut: formattedStockOut.length > 0 ? formattedStockOut : noData,
    };
  }

    /**
   * Mendapatkan analisis profitabilitas produk
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   * @param {Number} limit - Batas jumlah produk yang akan diambil
   */
    static async getProductProfitability(cabangId = null, limit = 10) {
      const whereClause = {};
      if (cabangId) {
        whereClause.cabangId = cabangId;
      }
  
      // Ambil produk dengan harga beli dan harga jual
      const products = await prisma.produk.findMany({
        where: whereClause,
        include: {
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
          transaksiDetail: {
            select: {
              jumlah: true,
              harga_satuan: true,
            },
          },
          cabang: {
            select: {
              namaCabang: true,
            },
          },
        },
      });
  
      // Hitung profitabilitas untuk setiap produk
      const profitabilityData = products.map(product => {
        const hargaBeli = product.hargaBeli.toNumber();
        const hargaJual = product.hargaJual.toNumber();
        const margin = hargaJual - hargaBeli;
        const marginPercentage = (margin / hargaJual) * 100;
        
        // Hitung total penjualan
        const totalSold = product.transaksiDetail.reduce((sum, td) => sum + td.jumlah, 0);
        const totalRevenue = product.transaksiDetail.reduce((sum, td) => sum + (td.jumlah * td.harga_satuan.toNumber()), 0);
        const totalProfit = totalSold * margin;
        
        return {
          id: product.id,
          produkMasterId: product.produkMasterId,
          namaProduk: product.produkMaster.namaProduk,
          sku: product.produkMaster.sku,
          kategori: product.produkMaster.kategori?.namaKategori || 'Tidak ada kategori',
          cabang: product.cabang.namaCabang,
          hargaBeli,
          hargaJual,
          margin,
          marginPercentage: parseFloat(marginPercentage.toFixed(2)),
          totalSold,
          totalRevenue,
          totalProfit,
          roi: parseFloat(((totalProfit / (hargaBeli * totalSold)) * 100).toFixed(2)),
        };
      });
  
      // Urutkan berdasarkan total profit (tertinggi dulu)
      profitabilityData.sort((a, b) => b.totalProfit - a.totalProfit);
      
      return profitabilityData.slice(0, limit);
    }


      /**
   * Mendapatkan analisis perputaran stok produk
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   * @param {Number} limit - Batas jumlah produk yang akan diambil
   * @param {Number} days - Jumlah hari untuk analisis
   */
  static async getStockTurnoverAnalysis(cabangId = null, limit = 10, days = 30) {
    const whereClause = {};
    if (cabangId) {
      whereClause.cabangId = cabangId;
    }
    
    // Tanggal untuk filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Ambil produk dengan stok dan transaksi
    const products = await prisma.produk.findMany({
      where: whereClause,
      include: {
        produkMaster: {
          select: {
            namaProduk: true,
            sku: true,
          },
        },
        transaksiDetail: {
          where: {
            transaksi: {
              tanggal: {
                gte: startDate,
              },
            },
          },
          select: {
            jumlah: true,
            transaksi: {
              select: {
                tanggal: true,
              },
            },
          },
        },
        cabang: {
          select: {
            namaCabang: true,
          },
        },
      },
    });
    
    // Hitung perputaran stok untuk setiap produk
    const turnoverData = products.map(product => {
      // Total penjualan dalam periode
      const totalSold = product.transaksiDetail.reduce((sum, td) => sum + td.jumlah, 0);
      
      // Rata-rata penjualan per hari
      const avgDailySales = totalSold / days;
      
      // Stok saat ini
      const currentStock = product.stok;
      
      // Estimasi berapa hari stok akan habis
      const daysUntilStockOut = currentStock > 0 && avgDailySales > 0 
        ? Math.round(currentStock / avgDailySales) 
        : (currentStock > 0 ? 999 : 0); // Jika tidak ada penjualan tapi ada stok, set nilai tinggi
      
      // Turnover rate (berapa kali stok terjual dalam periode)
      const turnoverRate = currentStock > 0 
        ? parseFloat((totalSold / currentStock).toFixed(2)) 
        : 0;
      
      return {
        id: product.id,
        produkMasterId: product.produkMasterId,
        namaProduk: product.produkMaster.namaProduk,
        sku: product.produkMaster.sku,
        cabang: product.cabang.namaCabang,
        stok: currentStock,
        totalSold,
        avgDailySales: parseFloat(avgDailySales.toFixed(2)),
        daysUntilStockOut,
        turnoverRate,
        needsRestock: daysUntilStockOut < 7, // Flag jika perlu restock dalam 7 hari
      };
    });
    
    // Urutkan berdasarkan turnover rate (tertinggi dulu)
    turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate);
    
    return turnoverData.slice(0, limit);
  }

    /**
   * Mendapatkan analisis performa produk berdasarkan kategori
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   */
    static async getCategoryPerformance(cabangId = null) {
      // Ambil semua kategori
      const categories = await prisma.kategori.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          namaKategori: true,
        },
      });
      
      // Data performa per kategori
      const categoryPerformance = await Promise.all(
        categories.map(async (category) => {
          // Query untuk produk dalam kategori ini
          const whereClause = {
            produkMaster: {
              kategoriId: category.id,
              deletedAt: null,
            },
          };
          
          if (cabangId) {
            whereClause.cabangId = cabangId;
          }
          
          // Ambil produk dalam kategori
          const products = await prisma.produk.findMany({
            where: whereClause,
            include: {
              transaksiDetail: {
                select: {
                  jumlah: true,
                  harga_satuan: true,
                },
              },
            },
          });
          
          // Hitung metrik untuk kategori
          const totalProducts = products.length;
          const totalSold = products.reduce(
            (sum, product) => sum + product.transaksiDetail.reduce((total, td) => total + td.jumlah, 0), 
            0
          );
          const totalRevenue = products.reduce(
            (sum, product) => sum + product.transaksiDetail.reduce(
              (total, td) => total + (td.jumlah * td.harga_satuan.toNumber()), 
              0
            ), 
            0
          );
          const totalStock = products.reduce((sum, product) => sum + product.stok, 0);
          
          // Hitung nilai inventori untuk kategori
          const inventoryValue = products.reduce(
            (sum, product) => sum + (product.stok * product.hargaBeli.toNumber()),
            0
          );
          
          return {
            id: category.id,
            namaKategori: category.namaKategori,
            totalProducts,
            totalSold,
            totalRevenue,
            totalStock,
            inventoryValue,
            avgRevenuePerProduct: totalProducts > 0 ? parseFloat((totalRevenue / totalProducts).toFixed(2)) : 0,
            stockToSalesRatio: totalSold > 0 ? parseFloat((totalStock / totalSold).toFixed(2)) : 0,
          };
        })
      );
      
      // Urutkan berdasarkan total revenue (tertinggi dulu)
      return categoryPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

      /**
   * Mendapatkan analisis penjualan produk berdasarkan waktu
   * @param {String} cabangId - ID cabang untuk filter data (opsional)
   * @param {Number} months - Jumlah bulan untuk analisis
   * @param {Number} topProducts - Jumlah produk teratas yang akan dianalisis
   */
      static async getProductSalesTrend(cabangId = null, months = 6, topProducts = 5) {
        // Generate month labels for the last N months
        const monthLabels = [];
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthLabels.push(monthLabel);
        }
      
        // Query using the materialized view with correct template literal syntax
        let result;
        if (cabangId) {
          result = await prisma.$queryRaw`
            SELECT 
              produk_id,
              nama_produk,
              to_char(month, 'YYYY-MM') as month_key,
              total_sold,
              total_revenue
            FROM mv_product_sales_trend
            WHERE rank <= ${topProducts}
            AND produk_id IN (SELECT produk_id FROM produk WHERE cabang_id = ${cabangId})
            ORDER BY month, rank
          `;
        } else {
          result = await prisma.$queryRaw`
            SELECT 
              produk_id,
              nama_produk,
              to_char(month, 'YYYY-MM') as month_key,
              total_sold,
              total_revenue
            FROM mv_product_sales_trend
            WHERE rank <= ${topProducts}
            ORDER BY month, rank
          `;
        }
      
        // Process the query results
        const productSales = {};
      
        // Process data from materialized view
        result.forEach(row => {
          const produkId = row.produk_id;
          const monthKey = row.month_key;
          
          if (!productSales[produkId]) {
            productSales[produkId] = {
              produkId,
              namaProduk: row.nama_produk,
              totalSold: 0,
              totalRevenue: 0,
              monthlySales: {},
            };
      
            // Initialize all months with zero
            monthLabels.forEach(month => {
              productSales[produkId].monthlySales[month] = {
                sold: 0,
                revenue: 0,
              };
            });
          }
      
          // Safe conversion of BigInt values
          const totalSold = typeof row.total_sold === 'bigint' ? parseInt(row.total_sold.toString()) : row.total_sold;
          const totalRevenue = typeof row.total_revenue === 'bigint' ? parseFloat(row.total_revenue.toString()) : row.total_revenue;
      
          // Update total
          productSales[produkId].totalSold += totalSold;
          productSales[produkId].totalRevenue += totalRevenue;
      
          // Update monthly data if the month exists in our range
          if (productSales[produkId].monthlySales[monthKey]) {
            productSales[produkId].monthlySales[monthKey].sold = totalSold;
            productSales[produkId].monthlySales[monthKey].revenue = totalRevenue;
          }
        });
      
        // Convert to array and ensure we have only top products
        const productSalesArray = Object.values(productSales)
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, topProducts);
      
        // Format data for chart display
        const formattedData = {
          labels: monthLabels,
          datasets: productSalesArray.map(product => {
            // Convert monthly sales to arrays for charting
            const salesData = monthLabels.map(month => 
              product.monthlySales[month] ? product.monthlySales[month].sold : 0
            );
            const revenueData = monthLabels.map(month => 
              product.monthlySales[month] ? product.monthlySales[month].revenue : 0
            );
      
            return {
              produkId: product.produkId,
              namaProduk: product.namaProduk,
              totalSold: product.totalSold,
              totalRevenue: product.totalRevenue,
              salesData,
              revenueData,
            };
          }),
        };
      
        return formattedData;
      }
      
      /**
       * Mendapatkan rekomendasi produk untuk promosi atau restock
       * @param {String} cabangId - ID cabang untuk filter data (opsional)
       * @param {Number} limit - Jumlah maksimum rekomendasi per kategori
       */
      static async getProductRecommendations(cabangId = null, limit = 5) {
        // Query using the materialized view with correct template literal syntax
        let products;
        if (cabangId) {
          products = await prisma.$queryRaw`
            SELECT 
              produk_id,
              produk_master_id,
              nama_produk,
              sku,
              cabang_id,
              nama_cabang,
              stok,
              sales_30_days,
              sales_previous_60_days,
              avg_daily_sales,
              sales_growth,
              days_until_stock_out,
              margin,
              margin_percentage,
              status
            FROM 
              mv_product_recommendations
            WHERE cabang_id = ${cabangId}
          `;
        } else {
          products = await prisma.$queryRaw`
            SELECT 
              produk_id,
              produk_master_id,
              nama_produk,
              sku,
              cabang_id,
              nama_cabang,
              stok,
              sales_30_days,
              sales_previous_60_days,
              avg_daily_sales,
              sales_growth,
              days_until_stock_out,
              margin,
              margin_percentage,
              status
            FROM 
              mv_product_recommendations
          `;
        }
      
        // Convert BigInt values to regular numbers
        const processedProducts = products.map(p => {
          // Create a new object with converted values
          return {
            ...p,
            sales_30_days: typeof p.sales_30_days === 'bigint' ? parseInt(p.sales_30_days.toString()) : p.sales_30_days,
            sales_previous_60_days: typeof p.sales_previous_60_days === 'bigint' ? parseInt(p.sales_previous_60_days.toString()) : p.sales_previous_60_days,
            avg_daily_sales: typeof p.avg_daily_sales === 'bigint' ? parseFloat(p.avg_daily_sales.toString()) : p.avg_daily_sales,
            sales_growth: typeof p.sales_growth === 'bigint' ? parseFloat(p.sales_growth.toString()) : p.sales_growth,
            days_until_stock_out: typeof p.days_until_stock_out === 'bigint' ? parseInt(p.days_until_stock_out.toString()) : p.days_until_stock_out,
            margin: typeof p.margin === 'bigint' ? parseFloat(p.margin.toString()) : p.margin,
            margin_percentage: typeof p.margin_percentage === 'bigint' ? parseFloat(p.margin_percentage.toString()) : p.margin_percentage,
            stok: typeof p.stok === 'bigint' ? parseInt(p.stok.toString()) : p.stok
          };
        });
      
        // Rekomendasi produk
        const recommendations = {
          // Produk yang perlu direstok segera (stok akan habis dalam 7 hari dan penjualan bagus)
          needsRestock: processedProducts
            .filter(p => p.days_until_stock_out <= 7 && p.days_until_stock_out > 0 && p.sales_30_days > 0)
            .sort((a, b) => a.days_until_stock_out - b.days_until_stock_out)
            .slice(0, limit),
          
          // Produk dengan pertumbuhan penjualan tinggi (potensial untuk promosi)
          highGrowth: processedProducts
            .filter(p => p.sales_growth > 20 && p.sales_30_days >= 5)
            .sort((a, b) => b.sales_growth - a.sales_growth)
            .slice(0, limit),
          
          // Produk dengan margin tinggi (potensial untuk promosi)
          highMargin: processedProducts
            .filter(p => p.margin_percentage > 30 && p.sales_30_days > 0)
            .sort((a, b) => b.margin_percentage - a.margin_percentage)
            .slice(0, limit),
          
          // Produk dengan performa buruk (perlu perhatian)
          poorPerformers: processedProducts
            .filter(p => p.stok > 10 && p.sales_30_days === 0 && p.status === 'aktif')
            .sort((a, b) => b.stok - a.stok)
            .slice(0, limit),
          
          // Produk yang overstocked (terlalu banyak stok dibanding penjualan)
          overstocked: processedProducts
            .filter(p => p.stok > 0 && p.avg_daily_sales > 0 && p.days_until_stock_out > 60)
            .sort((a, b) => b.days_until_stock_out - a.days_until_stock_out)
            .slice(0, limit),
        };
        
        return recommendations;
      }

  /**
   * Invalidate cache produk dashboard
   * @param {String} cabangId - ID cabang untuk pattern cache yang akan dihapus
   */
  static async invalidateProductDashboardCache(cabangId = null) {
    if (cabangId) {
      await cacheDelete(createCacheKey("product-dashboard-data", cabangId));
    } else {
      await cacheDeletePattern("product-dashboard-*");
    }
    return { success: true };
  }
}

module.exports = ProductDashboardService;
