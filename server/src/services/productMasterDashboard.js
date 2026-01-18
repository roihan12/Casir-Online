const prisma = require("../config/db");
const { cacheSet, cacheGet, cacheDelete, createCacheKey } = require("../utils/redisUtils");

/**
 * Get product dashboard statistics
 * Returns counts for total products, active products, inactive products, and categories
 */
const getProductDashboardStats = async () => {
  // Try to get from cache first
  const cacheKey = createCacheKey("product-dashboard", "stats");
  const cachedStats = await cacheGet(cacheKey);
  
  if (cachedStats) {
    return cachedStats;
  }

  // If not in cache, fetch from database
  const [totalProducts, activeProducts, inactiveProducts, totalCategories] = await Promise.all([
    // Total products (not deleted)
    prisma.produkMaster.count({
      where: {
        deletedAt: null,
      }
    }),
    
    // Active products
    prisma.produkMaster.count({
      where: {
        status: "aktif",
        deletedAt: null,
      }
    }),
    
    // Inactive products
    prisma.produkMaster.count({
      where: {
        status: "nonaktif",
        deletedAt: null,
      }
    }),
    
    // Total categories
    prisma.kategori.count({
      where: {
        deletedAt: null,
      }
    })
  ]);

  // Get most popular category
  const popularCategory = await prisma.kategori.findFirst({
    where: {
      deletedAt: null,
    },
    orderBy: {
      produkMaster: {
        _count: 'desc'
      }
    },
    select: {
      id: true,
      namaKategori: true,
      _count: {
        select: {
          produkMaster: true
        }
      }
    },
    take: 1
  });

  // Calculate products added this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const productsAddedThisMonth = await prisma.produkMaster.count({
    where: {
      createdAt: {
        gte: startOfMonth
      },
      deletedAt: null
    }
  });

  // Prepare dashboard data
  const dashboardData = {
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalCategories,
    productsAddedThisMonth,
    mostPopularCategory: popularCategory 
      ? `${popularCategory.namaKategori} - ${popularCategory._count.produkMaster} produk`
      : "-"
  };

  // Cache the result for 5 minutes
  await cacheSet(cacheKey, dashboardData, 300);
  
  return dashboardData;
};

/**
 * Invalidate product dashboard cache
 */
const invalidateProductDashboardCache = async () => {
  const cacheKey = createCacheKey("product-dashboard", "stats");
  await cacheDelete(cacheKey);
};

module.exports = {
  getProductDashboardStats,
  invalidateProductDashboardCache
};