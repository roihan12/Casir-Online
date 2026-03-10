const prisma = require("../config/db");
const { createAuditLog } = require("../utils/auditLog");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createSupplierSchema,
  updateSupplierSchema,
} = require("../validation/supplierValidation");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");
const { getBranchesWithSupplierAccess } = require("./produkSupplierService");
const { logger } = require("../utils/logger");


/**
 * Create a new supplier with optimized database queries
 */
const createSupplier = async (data, context) => {
  const { userId, ipAddress } = context;
  const validData = validate(createSupplierSchema, data);
  const { cabang_id, namaSupplier } = validData;

  // Combine branch check and duplicate check in a single transaction
  const [cabang, supplierExists] = await Promise.all([
    prisma.cabang.findUnique({
      where: { id: cabang_id },
      select: { id: true }, // Only select needed fields
    }),
    prisma.supplier.findFirst({
      where: { namaSupplier, cabang_id },
      select: { id: true }, // Only select needed fields
    }),
  ]);

  if (!cabang) {
    throw new ResponseError(404, "Branch not found");
  }

  if (supplierExists) {
    throw new ResponseError(400, "Supplier already exists");
  }

  // Use a transaction for consistent writes
  return await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: validData,
      select: {
        id: true,
        namaSupplier: true,
        alamat: true,
        telepon: true,
        email: true,
        cabang_id: true,
        createdAt: true,
      },
    });

    // Create audit log asynchronously without awaiting
    createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id,
      action: "CREATE",
      tableName: "supplier",
      record_id: supplier.id,
      oldValues: null,
      new_values: validData,
    }).catch((error) => logger.error("Audit log creation failed:", error));

    return supplier;
  });
};

/**
 * Update an existing supplier with optimized queries
 */
const updateSupplier = async (id, data, context) => {
  const { userId, ipAddress } = context;
  const validData = validate(updateSupplierSchema, data);
  const { cabang_id } = validData;

  return await prisma.$transaction(async (tx) => {
    // Get only needed fields from old data
    const oldData = await tx.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        namaSupplier: true,
        alamat: true,
        telepon: true,
        email: true,
        cabang_id: true,
      },
    });

    if (!oldData) {
      throw new ResponseError(404, "Supplier not found");
    }

    // Update supplier
    const supplier = await tx.supplier.update({
      where: { id },
      data: validData,
      select: {
        id: true,
        namaSupplier: true,
        alamat: true,
        telepon: true,
        email: true,
        cabang_id: true,
        updatedAt: true,
      },
    });

    // Create audit log asynchronously
    createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id,
      action: "UPDATE",
      tableName: "supplier",
      record_id: supplier.id,
      oldValues: oldData,
      new_values: validData,
    }).catch((error) => logger.error("Audit log creation failed:", error));

    return supplier;
  });
};

/**
 * Delete a supplier with optimized transaction
 */
const deleteSupplier = async (id, context) => {
  const { userId, ipAddress } = context;

  return await prisma.$transaction(async (tx) => {
    // Find existing supplier with minimal fields
    const oldData = await tx.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        namaSupplier: true,
        cabang_id: true,
      },
    });

    if (!oldData) {
      throw new ResponseError(404, "Supplier not found");
    }

    // Delete supplier
    await tx.supplier.delete({ where: { id } });

    // Create audit log asynchronously
    createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id: oldData.cabang_id,
      action: "DELETE",
      tableName: "supplier",
      record_id: id,
      oldValues: oldData,
      new_values: null,
    }).catch((error) => logger.error("Audit log creation failed:", error));

    return { message: "Supplier deleted successfully" };
  });
};

/**
 * Optimized retrieval of all suppliers with pagination and caching
 */
const getAllSuppliers = async ({
  page = 1,
  limit = 10,
  search = "",
  cabang_id = null,
  status = null,
}) => {
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Optimize where clause construction
  const whereClause = {};

  // Add search filter
  if (search) {
    whereClause.namaSupplier = { contains: search, mode: "insensitive" };
  }

  // Add cabang filter
  if (cabang_id) {
    whereClause.cabang_id = cabang_id;
  }

  // Add status filter
  if (status) {
    whereClause.status = status;
  }

  // Execute both queries in parallel
  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        namaSupplier: true,
        alamat: true,
        telepon: true,
        email: true,
        cabang_id: true,
        status: true,
        createdAt: true,
        picNama: true,
        cabang: {
          select: {
            namaCabang: true,
          },
        },
      },
    }),
    prisma.supplier.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a supplier by ID with optimized query
 */
const getSupplierById = async (id) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: {
      id: true,
      namaSupplier: true,
      alamat: true,
      telepon: true,
      email: true,
      npwp: true,
      picNama: true,
      picKontak: true,
      status: true,
      cabang_id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!supplier) {
    throw new ResponseError(404, "Supplier not found");
  }

  return supplier;
};

/**
 * Get suppliers by branch with optimized pagination
 */
const getSupplierByCabang = async (
  cabang_id,
  { page = 1, limit = 10, search = "", status = null }
) => {
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Optimize where clause construction
  const whereClause = { cabang_id };

  // Add search filter
  if (search) {
    whereClause.namaSupplier = { contains: search, mode: "insensitive" };
  }

  // Add status filter
  if (status) {
    whereClause.status = status;
  }

  // Execute both queries in parallel
  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        namaSupplier: true,
        alamat: true,
        telepon: true,
        email: true,
        cabang_id: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.supplier.count({ where: whereClause }),
  ]);

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / take),
      currentPage: Number(page),
      itemsPerPage: take,
      hasNextPage: page < Math.ceil(total / take),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get dashboard statistics for suppliers
 * @param {string|null} cabangId - Optional branch ID to filter by
 * @returns {Promise<Object>} - Dashboard statistics
 */
const getSupplierDashboardStats = async (cabangId = null) => {
  const cacheKey = createCacheKey("supplier-dashboard", cabangId || "all");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Get current date info
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Start of current month
      const startCurrentMonth = new Date(currentYear, currentMonth, 1);

      // Start of previous month
      const startPreviousMonth = new Date(currentYear, currentMonth - 1, 1);

      // End of previous month (start of current month - 1 day)
      const endPreviousMonth = new Date(startCurrentMonth);
      endPreviousMonth.setDate(endPreviousMonth.getDate() - 1);

      // Base where clause for branch filtering
      const whereClause = cabangId ? { cabang_id: cabangId } : {};

      // Execute all queries in parallel for efficiency
      const [
        // Total suppliers
        totalSuppliers,
        newSuppliersCurrentMonth,
        newSuppliersPreviousMonth,

        // Active suppliers
        activeSuppliers,
        activeSuppliersLastMonth,

        // Suppliers with products
        suppliersWithProducts,
        suppliersWithProductsLastMonth,

        // Suppliers with transactions
        suppliersWithTransactions,
        suppliersWithTransactionsLastMonth,
      ] = await Promise.all([
        // Total suppliers count
        prisma.supplier.count({
          where: whereClause,
        }),

        // New suppliers this month
        prisma.supplier.count({
          where: {
            ...whereClause,
            createdAt: { gte: startCurrentMonth },
          },
        }),

        // New suppliers last month
        prisma.supplier.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: startPreviousMonth,
              lt: startCurrentMonth,
            },
          },
        }),

        // Active suppliers
        prisma.supplier.count({
          where: {
            ...whereClause,
            status: "aktif",
          },
        }),

        // Active suppliers last month (suppliers created before end of last month that were active)
        prisma.supplier.count({
          where: {
            ...whereClause,
            status: "aktif",
            createdAt: { lt: startCurrentMonth },
          },
        }),

        // Suppliers with at least one product
        prisma.supplier.count({
          where: {
            ...whereClause,
            produkSupplier: {
              some: {
                status: "aktif",
              },
            },
          },
        }),

        // Suppliers with products last month
        prisma.supplier.count({
          where: {
            ...whereClause,
            produkSupplier: {
              some: {
                status: "aktif",
                createdAt: { lt: startCurrentMonth },
              },
            },
          },
        }),

        // Suppliers with transactions
        prisma.supplier.count({
          where: {
            ...whereClause,
            transaksi: {
              some: {},
            },
          },
        }),

        // Suppliers with transactions last month
        prisma.supplier.count({
          where: {
            ...whereClause,
            transaksi: {
              some: {
                tanggal: { lt: startCurrentMonth },
              },
            },
          },
        }),
      ]);

      // Calculate percentage changes
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100; 
      };

      return {
        total: {
          count: totalSuppliers,
          new: newSuppliersCurrentMonth,
          vsLastMonth: newSuppliersCurrentMonth - newSuppliersPreviousMonth,
        },
        active: {
          count: activeSuppliers,
          percentage:
            totalSuppliers > 0 ? (activeSuppliers / totalSuppliers) * 100 : 0,
          change: calculateChange(activeSuppliers, activeSuppliersLastMonth),
        },
        withProducts: {
          count: suppliersWithProducts,
          percentage:
            totalSuppliers > 0
              ? (suppliersWithProducts / totalSuppliers) * 100
              : 0,
          change: calculateChange(
            suppliersWithProducts,
            suppliersWithProductsLastMonth
          ),
        },
        withTransactions: {
          count: suppliersWithTransactions,
          percentage:
            totalSuppliers > 0
              ? Math.round((suppliersWithTransactions / totalSuppliers) * 100)
              : 0,
          change: calculateChange(
            suppliersWithTransactions,
            suppliersWithTransactionsLastMonth
          ),
        },
      };
    },
    300 // Cache for 5 minutes
  );
};

/**
 * Get detailed information about a supplier
 * @param {string} supplierId - The supplier ID
 * @returns {Promise<Object>} - Detailed supplier information including stats
 */
const getSupplierDetail = async (supplierId) => {
  const cacheKey = createCacheKey("supplier", `detail:${supplierId}`);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Get base supplier information
      const supplier = await prisma.supplier.findUnique({
        where: {
          id: supplierId,
          deletedAt: null,
        },
        include: {
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
        },
      });

      if (!supplier) {
        throw new ResponseError(404, "Supplier tidak ditemukan");
      }

      // Get product count
      const productCount = await prisma.produkSupplier.count({
        where: {
          supplierId,
          status: "aktif",
        },
      });

      // Get transaction count and total value
      const transactions = await prisma.transaksi.findMany({
        where: {
          supplier_id: supplierId,
          status_pembayaran: { not: "DIBATALKAN" },
        },
        select: {
          total: true,
        },
      });

      const transactionCount = transactions.length;
      const transactionTotal = transactions.reduce(
        (sum, item) => sum + parseFloat(item.total),
        0
      );

      // Get related branches
      const relatedBranches = await getBranchesWithSupplierAccess(supplierId);

      // Format final response
      return {
        ...supplier,
        stats: {
          totalProduk: productCount,
          totalTransaksi: transactionCount,
          nilaiTransaksi: transactionTotal,
          tanggalDaftar: supplier.createdAt,
        },
        relatedBranches,
      };
    },
    3600 // 1 hour cache
  );
};

module.exports = {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  getSupplierByCabang,
  getSupplierDashboardStats,
  getSupplierDetail,
};
