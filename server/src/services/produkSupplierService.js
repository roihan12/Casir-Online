const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { createAuditLog } = require("../utils/auditLog");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
  cacheDeletePatternScan,
} = require("../utils/redisUtils");

/**
 * Create a new product-supplier relationship
 * @param {Object} data - The relationship data
 * @param {Object} context - The audit context
 * @returns {Promise<Object>} - The created relationship
 */
const createProdukSupplier = async (data, context) => {
  const { userId, ipAddress, userName } = context;

  // Parallelize all validation checks for better performance
  const [produkMaster, supplier, existingRelation] = await Promise.all([
    // Check if product master exists (use count for faster validation)
    prisma.produkMaster.findFirst({
      where: { id: data.produkMasterId, deletedAt: null },
      select: { id: true },
    }),
    // Check if supplier exists
    prisma.supplier.findFirst({
      where: { id: data.supplierId, deletedAt: null },
      select: { id: true, cabang_id: true },
    }),
    // Check if relationship already exists
    prisma.produkSupplier.findFirst({
      where: {
        produkMasterId: data.produkMasterId,
        supplierId: data.supplierId,
      },
      select: { id: true },
    }),
  ]);

  if (!produkMaster) {
    throw new ResponseError(404, "Produk master tidak ditemukan");
  }

  if (!supplier) {
    throw new ResponseError(404, "Supplier tidak ditemukan");
  }

  if (existingRelation) {
    throw new ResponseError(
      400,
      "Hubungan antara produk dan supplier sudah ada"
    );
  }

  // Create new relationship
  return prisma.$transaction(async (tx) => {
    const newRelation = await tx.produkSupplier.create({
      data: {
        produkMasterId: data.produkMasterId,
        supplierId: data.supplierId,
        isPrimary: data.isPrimary || false,
        hargaBeli: data.hargaBeli,
        minPembelian: data.minPembelian,
        leadTime: data.leadTime,
        kodeProdukSupplier: data.kodeProdukSupplier,
        status: data.status || "aktif",
        created_by_user_Id: userId,
        created_by: userName,
        cabangId: data.cabangId,
      },
      include: {
        produkMaster: {
          select: {
            id: true,
            namaProduk: true,
            sku: true,
          },
        },
        supplier: {
          select: {
            id: true,
            namaSupplier: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id: supplier.cabang_id,
      action: "CREATE",
      tableName: "produk_supplier",
      record_id: newRelation.id,
      oldValues: null,
      new_values: data,
    });

    // Invalidate relevant caches using non-blocking SCAN
    await cacheDeletePatternScan(`produk-master:${data.produkMasterId}*`);
    await cacheDeletePatternScan(`supplier:${data.supplierId}*`);
    await cacheDeletePatternScan("produk-supplier:*");

    return newRelation;
  });
};

/**
 * Update an existing product-supplier relationship
 * @param {string} id - The relationship ID
 * @param {Object} data - The updated data
 * @param {Object} context - The audit context
 * @returns {Promise<Object>} - The updated relationship
 */
const updateProdukSupplier = async (id, data, context) => {
  const { userId, ipAddress, userName } = context;

  return prisma.$transaction(async (tx) => {
    // Find existing relationship inside transaction
    const existingRelation = await tx.produkSupplier.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { cabang_id: true },
        },
      },
    });

    if (!existingRelation) {
      throw new ResponseError(404, "Hubungan produk-supplier tidak ditemukan");
    }

    // If setting as primary, unset other primary relationships inside transaction
    if (data.isPrimary) {
      await tx.produkSupplier.updateMany({
        where: {
          produkMasterId: existingRelation.produkMasterId,
          id: { not: id },
          isPrimary: true,
        },
        data: {
          isPrimary: false,
          updated_by_user_Id: userId,
          updated_by: userName,
        },
      });
    }

    const oldValues = { ...existingRelation };

    const updatedRelation = await tx.produkSupplier.update({
      where: { id },
      data: {
        isPrimary:
          data.isPrimary !== undefined
            ? data.isPrimary
            : existingRelation.isPrimary,
        hargaBeli: data.hargaBeli || existingRelation.hargaBeli,
        minPembelian:
          data.minPembelian !== undefined
            ? data.minPembelian
            : existingRelation.minPembelian,
        leadTime:
          data.leadTime !== undefined
            ? data.leadTime
            : existingRelation.leadTime,
        kodeProdukSupplier:
          data.kodeProdukSupplier || existingRelation.kodeProdukSupplier,
        status: data.status || existingRelation.status,
        updated_by_user_Id: userId,
        updated_by: userName,
      },
      include: {
        produkMaster: {
          select: {
            id: true,
            namaProduk: true,
            sku: true,
          },
        },
        supplier: {
          select: {
            id: true,
            namaSupplier: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id: existingRelation.supplier.cabang_id,
      action: "UPDATE",
      tableName: "produk_supplier",
      record_id: id,
      oldValues,
      new_values: updatedRelation,
    });

    // Invalidate relevant caches
    await cacheDeletePattern(
      `produk-master:${existingRelation.produkMasterId}*`
    );
    await cacheDeletePattern(`supplier:${existingRelation.supplierId}*`);
    await cacheDeletePattern("produk-supplier:*");

    return updatedRelation;
  });
};

/**
 * Delete a product-supplier relationship
 * @param {string} id - The relationship ID
 * @param {Object} context - The audit context
 * @returns {Promise<Object>} - Success message
 */
const deleteProdukSupplier = async (id, context) => {
  const { userId, ipAddress, userName } = context;

  // Find existing relationship
  const existingRelation = await prisma.produkSupplier.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { cabang_id: true },
      },
    },
  });

  if (!existingRelation) {
    throw new ResponseError(404, "Hubungan produk-supplier tidak ditemukan");
  }

  return prisma.$transaction(async (tx) => {
    const deletedRelation = await tx.produkSupplier.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      cabang_id: existingRelation.supplier.cabang_id,
      action: "DELETE",
      tableName: "produk_supplier",
      record_id: id,
      oldValues: existingRelation,
      new_values: null,
    });

    // Invalidate relevant caches
    await cacheDeletePattern(
      `produk-master:${existingRelation.produkMasterId}*`
    );
    await cacheDeletePattern(`supplier:${existingRelation.supplierId}*`);
    await cacheDeletePattern("produk-supplier:*");

    return { message: "Hubungan produk-supplier berhasil dihapus" };
  });
};

/**
 * Get all product-supplier relationships for a product master
 * @param {string} produkMasterId - The product master ID
 * @param {string} cabangId - Optional branch ID to filter by
 * @returns {Promise<Array>} - List of relationships
 */
const getSuppliersByProduct = async (produkMasterId, cabangId = null) => {
  const cacheKey = createCacheKey(
    "produk-supplier",
    `product:${produkMasterId}:${cabangId || "all"}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      let whereCondition = {
        produkMasterId,
        status: "aktif",
      };

      // Add branch filter if specified
      if (cabangId) {
        whereCondition.cabangId = cabangId;
      }

      const suppliers = await prisma.produkSupplier.findMany({
        where: whereCondition,
        include: {
          supplier: {
            select: {
              id: true,
              namaSupplier: true,
              alamat: true,
              telepon: true,
              email: true,
              cabang_id: true,
              status: true,
            },
          },
          cabang: cabangId
            ? {
                select: {
                  id: true,
                  nama: true,
                },
              }
            : undefined,
        },
        orderBy: {
          isPrimary: "desc",
        },
      });

      return suppliers;
    },
    3600 // 1 hour cache
  );
};

/**
 * Get all product-supplier relationships for a supplier
 * @param {string} supplierId - The supplier ID
 * @param {Object} options - Pagination and search options
 * @returns {Promise<Object>} - List of relationships with pagination
 */
const getProductsBySupplier = async (
  supplierId,
  {
    page = 1,
    limit = 10,
    search = "",
    cabangId = null,
    produkMasterId = null,
    kategoriId = null,
  }
) => {
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Create cache key based on all filter parameters
  const cacheKey = createCacheKey(
    "produk-supplier",
    `supplier:${supplierId}`,
    `page:${page}:limit:${limit}:search:${search}:cabang:${cabangId || "all"}:produk:${produkMasterId || "all"}:kategori:${kategoriId || "all"}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Build search condition
      let whereCondition = {
        supplierId,
        status: "aktif",
      };

      // Add cabangId filter if specified
      if (cabangId) {
        whereCondition.cabangId = cabangId;
      }

      // Add produkMasterId filter if specified
      if (produkMasterId) {
        whereCondition.produkMasterId = produkMasterId;
      }

      // Add category filter if specified
      if (kategoriId) {
        whereCondition.produkMaster = {
          ...whereCondition.produkMaster,
          kategoriId,
        };
      }

      if (search) {
        whereCondition = {
          ...whereCondition,
          produkMaster: {
            ...(whereCondition.produkMaster || {}),
            namaProduk: {
              contains: search,
              mode: "insensitive",
            },
          },
        };
      }

      // Execute queries in parallel
  const [products, total] = await Promise.all([
    prisma.produkSupplier.findMany({
      skip,
      take,
      where: whereCondition,
      include: {
        produkMaster: {
          select: {
            id: true,
            namaProduk: true,
            sku: true,
            barcode: true,
            satuan: true,
            deskripsi: true,
            kategoriId: true,
            kategori: {
              select: {
                id: true,
                namaKategori: true,
              },
            },
            produk: {
              where: cabangId ? { cabangId } : undefined,
              select: {
                id: true,
                hargaBeli: true,
                hargaJual: true,
                stok: true,
                cabangId: true,
              },
            },
          },
        },
        cabang: cabangId
          ? {
              select: {
                id: true,
                namaCabang: true,
              },
            }
          : undefined,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.produkSupplier.count({
      where: whereCondition,
    }),
  ]);

  // Format response data to match the desired structure
  const formattedProducts = products.map((product) => {
    const formattedProduct = { ...product };

    // When cabangId is provided, simplify the produk array
    if (
      cabangId &&
      product.produkMaster?.produk &&
      product.produkMaster.produk.length > 0
    ) {
      // Keep the array structure but with only the single item
      formattedProduct.produkMaster = {
        ...product.produkMaster,
        produk: [product.produkMaster.produk[0]],
      };
    }

    return formattedProduct;
  });

      const totalPages = Math.ceil(total / limit);

      return {
        data: formattedProducts,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    1800 // 30 minutes cache for paginated data
  );
};

/**
 * Get all branches that have access to products from a specific supplier
 * @param {string} supplierId - The supplier ID
 * @returns {Promise<Array>} - List of branches with access to supplier's products
 */
const getBranchesWithSupplierAccess = async (supplierId) => {
  const cacheKey = createCacheKey("produk-supplier", `branches:${supplierId}`);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Get the supplier info to know its branch
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { cabang_id: true },
      });

      if (!supplier) {
        throw new ResponseError(404, "Supplier tidak ditemukan");
      }

      // Find all product masters connected to this supplier
      const productSuppliers = await prisma.produkSupplier.findMany({
        where: { supplierId },
        select: { produkMasterId: true },
      });

      const productMasterIds = productSuppliers.map((ps) => ps.produkMasterId);

      // Find all branches that have these products
      const branches = await prisma.cabang.findMany({
        where: {
          OR: [
            // The supplier's branch
            { id: supplier.cabang_id },
            // Branches with products from this supplier's product masters
            {
              produk: {
                some: {
                  produkMasterId: { in: productMasterIds },
                  deletedAt: null,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          namaCabang: true,
          alamat: true,
          telepon: true,
        },
      });

      return branches;
    },
    3600 // 1 hour cache for branch access data
  );
};

/**
 * Get products that are available to be added to a supplier
 * @param {string} supplierId - The supplier ID
 * @param {Object} options - Pagination and search options
 * @returns {Promise<Object>} - List of products that can be added to this supplier with pagination
 */
const getProductsForSupplier = async (
  supplierId,
  {
    page = 1,
    limit = 10,
    search = "",
    cabangId = null,
    kategoriId = null,
    status = "aktif",
  }
) => {
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // First, check if supplier exists (don't cache validation)
  const supplier = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      status: status,
    },
    select: {
      id: true,
      cabang_id: true,
    },
  });

  if (!supplier) {
    throw new ResponseError(404, "Supplier tidak ditemukan atau tidak aktif");
  }

  // Create cache key based on all filter parameters
  const cacheKey = createCacheKey(
    "produk-supplier",
    `available:${supplierId}`,
    `page:${page}:limit:${limit}:search:${search}:cabang:${cabangId || "all"}:kategori:${kategoriId || "all"}:status:${status}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Find all product masters already associated with this supplier
      const existingProductMasters = await prisma.produkSupplier.findMany({
        where: { supplierId },
        select: { produkMasterId: true },
      });

      const existingProductMasterIds = existingProductMasters.map(
        (pm) => pm.produkMasterId
      );

      // Build the where condition for products that can be added
      let whereCondition = {
        deletedAt: null,
        status: status,
      };

      // Exclude products already associated with this supplier
      if (existingProductMasterIds.length > 0) {
        whereCondition.id = {
          notIn: existingProductMasterIds,
        };
      }

      // Add branch filter if specified (to get products that exist in a specific branch)
      if (cabangId) {
        whereCondition.produk = {
          some: {
            cabangId: cabangId,
            deletedAt: null,
          },
        };
      }

      // Add category filter if specified
      if (kategoriId) {
        whereCondition.kategoriId = kategoriId;
      }

      // Add search filter if specified
      if (search) {
        whereCondition.OR = [
          { namaProduk: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ];
      }

      // Execute queries in parallel for better performance
      const [products, total] = await Promise.all([
        prisma.produkMaster.findMany({
          skip,
          take,
          where: whereCondition,
          include: {
            kategori: {
              select: {
                id: true,
                namaKategori: true,
              },
            },
            produk: cabangId
              ? {
                  where: {
                    cabangId: cabangId,
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    hargaBeli: true,
                    hargaJual: true,
                    stok: true,
                    cabangId: true,
                  },
                }
              : undefined,
          },
          orderBy: {
            namaProduk: "asc",
          },
        }),
        prisma.produkMaster.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: products,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    1800 // 30 minutes cache for paginated data
  );
};

/**
 * Get price history for all products from a supplier
 * @param {string} supplierId - The supplier ID
 * @param {Object} options - Options for filtering and pagination
 * @returns {Promise<Object>} - Price history data with pagination
 */
const getSupplierPriceHistory = async (
  supplierId,
  { page = 1, limit = 10, cabangId = null }
) => {
  try {
    const skip = (page - 1) * limit;

    // Build where clause for price history
    const whereClause = {
      supplierId, // ProdukPriceHistory has supplierId field
      ...(cabangId && { cabangId }),
    };

    // Get price history from ProdukPriceHistory table
    const [priceHistory, total] = await Promise.all([
      prisma.produkPriceHistory.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { tanggalPerubahan: "desc" },
        include: {
          produk: {
            select: {
              id: true,
              produkMaster: {
                select: {
                  id: true,
                  namaProduk: true,
                  sku: true,
                },
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
      }),
      prisma.produkPriceHistory.count({ where: whereClause }),
    ]);

    // Format the response
    const formattedData = priceHistory.map((history) => ({
      id: history.id,
      supplierId: history.supplierId,
      produkId: history.produkId,
      produkMasterId: history.produk.produkMaster.id,
      produkNama: history.produk.produkMaster.namaProduk,
      produkKode: history.produk.produkMaster.sku,
      cabangId: history.cabangId,
      cabangNama: history.cabang?.namaCabang,
      tipeHarga: history.tipeHarga,
      hargaLama: history.hargaLama,
      hargaBaru: history.hargaBaru,
      perubahan: history.hargaBaru - history.hargaLama,
      persentasePerubahan:
        history.hargaLama > 0
          ? ((history.hargaBaru - history.hargaLama) / history.hargaLama) * 100
          : 0,
      tanggalPerubahan: history.tanggalPerubahan,
      alasanPerubahan: history.alasanPerubahan,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching supplier price history:", error);
    throw new ResponseError(
      500,
      "Gagal mengambil riwayat harga supplier: " + error.message
    );
  }
};

module.exports = {
  createProdukSupplier,
  updateProdukSupplier,
  deleteProdukSupplier,
  getSuppliersByProduct,
  getProductsBySupplier,
  getBranchesWithSupplierAccess,
  getProductsForSupplier,
  getSupplierPriceHistory,
};
