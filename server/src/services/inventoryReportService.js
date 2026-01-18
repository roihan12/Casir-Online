const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// Get inventory value report
const getInventoryValueReport = async (filters) => {
  const {
    cabangId,
    kategoriId,
    calculateCost = true,
    includeLowStock = false,
  } = filters;

  // Build where clause
  const where = {
    cabangId,
  };

  // Add filter for low stock if requested
  if (includeLowStock) {
    where.minStok = {
      not: null,
    };
    where.stok = {
      lte: prisma.produk.fields.minStok,
    };
  }

  // Add kategori filter if provided
  if (kategoriId) {
    where.produkMaster = {
      kategoriId,
    };
  }

  // Get products with their inventory value
  const products = await prisma.produk.findMany({
    where,
    include: {
      produkMaster: {
        include: {
          kategori: true,
        },
      },
    },
  });

  // Calculate inventory values and summary
  let totalInventoryValue = 0;
  let totalItems = 0;
  const categoryValues = {};

  const productsWithValue = products.map((product) => {
    const stok = product.stok || 0;
    const hargaBeli = Number(product.hargaBeli);
    const hargaJual = Number(product.hargaJual);

    // Choose which value to calculate (cost or retail)
    const value = calculateCost ? stok * hargaBeli : stok * hargaJual;
    totalInventoryValue += value;
    totalItems += stok;

    // Add to category summary
    const categoryId = product.produkMaster.kategoriId;
    const categoryName =
      product.produkMaster.kategori?.namaKategori || "Uncategorized";

    if (!categoryValues[categoryId]) {
      categoryValues[categoryId] = {
        categoryId,
        categoryName,
        totalValue: 0,
        totalItems: 0,
        productCount: 0,
      };
    }

    categoryValues[categoryId].totalValue += value;
    categoryValues[categoryId].totalItems += stok;
    categoryValues[categoryId].productCount += 1;

    return {
      produkId: product.id,
      produkMasterId: product.produkMasterId,
      namaProduk: product.produkMaster.namaProduk,
      kategori: product.produkMaster.kategori?.namaKategori || "Uncategorized",
      stok,
      hargaBeli,
      hargaJual,
      nilaiInventory: value,
      statusStok:
        product.minStok && stok <= product.minStok ? "Low Stock" : "Normal",
    };
  });

  // Prepare summary by category
  const categorySummary = Object.values(categoryValues).sort(
    (a, b) => b.totalValue - a.totalValue
  );

  return {
    summary: {
      totalInventoryValue,
      totalItems,
      totalProducts: products.length,
      valuationType: calculateCost
        ? "Cost Value (Harga Beli)"
        : "Retail Value (Harga Jual)",
    },
    categorySummary,
    products: productsWithValue,
  };
};

// Get inventory movement report
const getInventoryMovementReport = async (filters) => {
  const {
    cabangId,
    produkId,
    startDate,
    endDate,
    referenceType,
    groupBy = "day", // 'day', 'week', 'month'
  } = filters;

  // Validate input
  if (!cabangId) {
    throw new ResponseError(400, "cabangId diperlukan");
  }

  if (!startDate || !endDate) {
    throw new ResponseError(400, "startDate dan endDate diperlukan");
  }

  // Parse dates
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Build where clause
  const where = {
    cabangId,
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (produkId) where.produkId = produkId;
  if (referenceType) where.referenceType = referenceType;

  // Get movements
  const movements = await prisma.inventoryMovement.findMany({
    where,
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
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group data by the specified interval
  const groupedData = {};
  const productData = {};
  const userActivity = {};
  const referenceTypeSummary = {};

  movements.forEach((movement) => {
    // Format date according to groupBy
    let groupKey;
    const date = new Date(movement.createdAt);

    switch (groupBy) {
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        groupKey = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD format
        break;
      case "month":
        groupKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        break;
      default: // day
        groupKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    }

    // Initialize group if not exists
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        period: groupKey,
        inflow: 0,
        outflow: 0,
        netChange: 0,
        movements: 0,
      };
    }

    // Update group statistics
    const quantity = movement.quantity;
    if (quantity > 0) {
      groupedData[groupKey].inflow += quantity;
    } else {
      groupedData[groupKey].outflow += Math.abs(quantity);
    }
    groupedData[groupKey].netChange += quantity;
    groupedData[groupKey].movements += 1;

    // Track product data
    const productId = movement.produkId;
    const productName = movement.produk.produkMaster.namaProduk;

    if (!productData[productId]) {
      productData[productId] = {
        productId,
        productName,
        totalMovements: 0,
        inflow: 0,
        outflow: 0,
        netChange: 0,
      };
    }

    if (quantity > 0) {
      productData[productId].inflow += quantity;
    } else {
      productData[productId].outflow += Math.abs(quantity);
    }
    productData[productId].netChange += quantity;
    productData[productId].totalMovements += 1;

    // Track user activity
    const userId = movement.userId;
    const userName = movement.user?.namaLengkap || "Unknown";

    if (!userActivity[userId]) {
      userActivity[userId] = {
        userId,
        userName,
        totalMovements: 0,
        itemsProcessed: 0,
      };
    }

    userActivity[userId].totalMovements += 1;
    userActivity[userId].itemsProcessed += Math.abs(quantity);

    // Track reference type summary
    const refType = movement.referenceType;

    if (!referenceTypeSummary[refType]) {
      referenceTypeSummary[refType] = {
        type: refType,
        count: 0,
        inflow: 0,
        outflow: 0,
      };
    }

    referenceTypeSummary[refType].count += 1;
    if (quantity > 0) {
      referenceTypeSummary[refType].inflow += quantity;
    } else {
      referenceTypeSummary[refType].outflow += Math.abs(quantity);
    }
  });

  // Convert grouped data to sorted array
  const timeSeriesData = Object.values(groupedData).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  // Sort product data by volume
  const productSummary = Object.values(productData)
    .sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow))
    .slice(0, 10); // Top 10 products by movement volume

  // Sort user activity by items processed
  const userSummary = Object.values(userActivity).sort(
    (a, b) => b.itemsProcessed - a.itemsProcessed
  );

  // Format reference type summary
  const refTypeSummary = Object.values(referenceTypeSummary).sort(
    (a, b) => b.count - a.count
  );

  return {
    summary: {
      totalMovements: movements.length,
      totalInflow: movements.reduce(
        (sum, m) => (m.quantity > 0 ? sum + m.quantity : sum),
        0
      ),
      totalOutflow: movements.reduce(
        (sum, m) => (m.quantity < 0 ? sum + Math.abs(m.quantity) : sum),
        0
      ),
      netChange: movements.reduce((sum, m) => sum + m.quantity, 0),
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      groupBy,
    },
    timeSeriesData,
    productSummary,
    userSummary,
    referenceTypeSummary: refTypeSummary,
  };
};

module.exports = {
  getInventoryValueReport,
  getInventoryMovementReport,
};
