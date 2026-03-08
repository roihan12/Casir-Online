const { Prisma } = require("@prisma/client");
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
} = require("../utils/redisUtils");

// Get all products with pagination and filtering
const getAllProduk = async ({
  search,
  produkMasterId,
  cabangId,
  status,
  minHarga,
  maxHarga,
  minStok,
  maxStok,
  kategoriId,
  createdAfter,
  createdBefore,
  updatedAfter,
  updatedBefore,
  sortBy = "updatedAt",
  sortOrder = "desc",
  page = 1,
  limit = 10,
}) => {
  // Buat cache key berdasarkan parameter filter
  const cacheKey = createCacheKey(
    "produk-list",
    `search:${search || "-"}-master:${produkMasterId || "-"}-cabang:${
      cabangId || "-"
    }-status:${status || "-"}-minHarga:${minHarga || "-"}-maxHarga:${
      maxHarga || "-"
    }-minStok:${minStok || "-"}-maxStok:${maxStok || "-"}-kategori:${
      kategoriId || "-"
    }-createdAfter:${createdAfter || "-"}-createdBefore:${
      createdBefore || "-"
    }-updatedAfter:${updatedAfter || "-"}-updatedBefore:${
      updatedBefore || "-"
    }-sortBy:${sortBy}-sortOrder:${sortOrder}-page:${page}-limit:${limit}`
  );

  // TTL cache untuk daftar produk (5 menit)
  const cacheTTL = 300;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const where = {};

      if (search) {
        where.OR = [
          {
            produkMaster: {
              namaProduk: { contains: search, mode: "insensitive" },
            },
          },
          {
            produkMaster: {
              sku: { contains: search, mode: "insensitive" },
            },
          },
          {
            produkMaster: {
              barcode: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }

      if (produkMasterId) {
        where.produkMasterId = produkMasterId;
      }

      if (cabangId) {
        where.cabangId = cabangId;
      }

      if (status) {
        where.status = status;
      }

      // Filter by price range
      if (minHarga !== undefined) {
        where.hargaJual = {
          ...(where.hargaJual || {}),
          gte: Number(minHarga),
        };
      }

      if (maxHarga !== undefined) {
        where.hargaJual = {
          ...(where.hargaJual || {}),
          lte: Number(maxHarga),
        };
      }

      // Filter by stock level
      if (minStok !== undefined) {
        where.stok = {
          ...(where.stok || {}),
          gte: Number(minStok),
        };
      }

      if (maxStok !== undefined) {
        where.stok = {
          ...(where.stok || {}),
          lte: Number(maxStok),
        };
      }

      // Filter by category
      if (kategoriId) {
        where.produkMaster = {
          ...(where.produkMaster || {}),
          kategoriId: kategoriId,
        };
      }

      // Filter by creation date
      if (createdAfter) {
        where.createdAt = {
          ...(where.createdAt || {}),
          gte: new Date(createdAfter),
        };
      }

      if (createdBefore) {
        where.createdAt = {
          ...(where.createdAt || {}),
          lte: new Date(createdBefore),
        };
      }

      // Filter by update date
      if (updatedAfter) {
        where.updatedAt = {
          ...(where.updatedAt || {}),
          gte: new Date(updatedAfter),
        };
      }

      if (updatedBefore) {
        where.updatedAt = {
          ...(where.updatedAt || {}),
          lte: new Date(updatedBefore),
        };
      }

      // Prepare sort options
      const orderBy = {};
      
      // Handle special sort cases
      if (sortBy === "harga") {
        orderBy.hargaJual = sortOrder.toLowerCase();
      } else if (sortBy === "nama") {
        orderBy.produkMaster = { namaProduk: sortOrder.toLowerCase() };
      } else {
        // Default sorting
        orderBy[sortBy] = sortOrder.toLowerCase();
      }

      const [total, data] = await Promise.all([
        prisma.produk.count({ where }),
        prisma.produk.findMany({
          where,
          include: {
            produkMaster: {
              include: {
                kategori: true,
                produkImage: {
                  orderBy: {
                    urutan: "asc",
                  },
                },
              },
            },
            cabang: true,
          },
          skip,
          take,
          orderBy,
        }),
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
    },
    cacheTTL
  );
};


// Pencarian produk dengan berbagai parameter
const searchProducts = async (params) => {
  const {
    query,
    cabangId,
    kategoriId,
    limit = 10,
    page = 1,
    sortBy = "namaProduk",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * limit;
  
  // Buat kondisi pencarian
  const where = { cabangId };
  
  if (query) {
    where.OR = [
      {
        produkMaster: {
          namaProduk: {
            contains: query,
            mode: 'insensitive'
          }
        }
      },
      {
        produkMaster: {
          sku: {
            contains: query,
            mode: 'insensitive'
          }
        }
      },
      {
        produkMaster: {
          barcode: {
            contains: query,
            mode: 'insensitive'
          }
        }
      },
    ];
  }
  
  if (kategoriId) {
    where.produkMaster = {
      ...where.produkMaster,
      kategoriId
    };
  }

  // Hitung total record
  const totalCount = await prisma.produk.count({ where });

  // Ambil data dengan paginasi dan sorting
  const products = await prisma.produk.findMany({
    where,
    include: {
      produkMaster: {
        include: {
          kategori: true,
          produkImage: true
        }
      }
    },
    orderBy: {
      [sortBy === 'namaProduk' ? 'produkMaster' : sortBy]: {
        [sortBy === 'namaProduk' ? 'namaProduk' : sortBy]: sortOrder
      }
    },
    skip,
    take: parseInt(limit)
  });

  // Hitung total halaman
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: products,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan produk berdasarkan barcode
const getProductByBarcode = async (barcode, cabangId) => {
  const product = await prisma.produk.findFirst({
    where: {
      barcode,
      cabangId
    },
    include: {
      produkMaster: {
        include: {
          kategori: true
        }
      }
    }
  });

  if (!product) {
    throw new ResponseError(404, "Produk dengan barcode tersebut tidak ditemukan");
  }

  return product;
};

// Mendapatkan produk yang sering digunakan
const getFrequentlyUsedProducts = async (cabangId, limit = 10) => {
  // Dapatkan produk yang paling sering muncul dalam transaksi
  const frequentProducts = await prisma.transaksiDetail.groupBy({
    by: ['produk_id'],
    where: {
      transaksi: {
        cabang_id : cabangId
      },
      created_at: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 hari terakhir
      }
    },
    _count: {
      produk_id: true
    },
    orderBy: {
      _count: {
        produk_id: 'desc'
      }
    },
    take: limit
  });

  // Dapatkan detail produk
  const productIds = frequentProducts.map(item => item.produk_id);
  
  const products = await prisma.produk.findMany({
    where: {
      id: {
        in: productIds
      },
      cabangId
    },
    include: {
      produkMaster: true
    }
  });

  // Urutkan hasil sesuai dengan frekuensi penggunaan
  return products.sort((a, b) => {
    const aCount = frequentProducts.find(item => item.produk_id=== a.id)?._count.produk_id || 0;
    const bCount = frequentProducts.find(item => item.produk_id === b.id)?._count.produk_id || 0;
    return bCount - aCount;
  });
};


// Get a product by ID
const getProdukById = async (id) => {
  const cacheKey = createCacheKey("produk", id);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const product = await prisma.produk.findFirst({
        where: {
          id,
        },
        include: {
          produkMaster: {
            include: {
              kategori: {
                select: {
                  id: true,
                  namaKategori: true,
                  status: true,
                },
              },
              produkImage: {
                orderBy: {
                  urutan: "asc",
                },
              },
            },
          },
          cabang: true,
          produkPriceHistory: {
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });

      // Tambahkan pengecekan jika produk tidak ditemukan
      if (!product) {
        throw new ResponseError(404, "Product not found");
      }

      return product;
    },
    3600
  ); // Cache 1 jam
};

// Get products by produkMasterId and cabangId
const getProdukByMasterAndCabang = async (produkMasterId, cabangId) => {
  const cacheKey = createCacheKey(
    "produk-master-cabang",
    `${produkMasterId}:${cabangId}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const product = await prisma.produk.findFirst({
        where: {
          produkMasterId,
          cabangId,
        },
        include: {
          produkMaster: true,
          cabang: true,
        },
      });

      // Tambahkan pengecekan jika produk tidak ditemukan
      if (!product) {
        throw new ResponseError(
          404,
          "Product not found for this master and branch"
        );
      }

      return product;
    },
    3600
  ); // Cache 1 jam
};

// Create a new product
const createProduk = async (data, { userId, userName, ipAddress }) => {
  const newProduk = await prisma.$transaction(async (tx) => {
    // Check if produkMaster exists
    const produkMaster = await tx.produkMaster.findUnique({
      where: { id: data.produkMasterId },
    });

    if (!produkMaster) {
      throw new ResponseError(404, "Product master not found");
    }

    // Check if cabang exists
    const cabang = await tx.cabang.findUnique({
      where: { id: data.cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Branch not found");
    }

    // Check if product already exists for this master and branch
    const existingProduk = await tx.produk.findFirst({
      where: {
        produkMasterId: data.produkMasterId,
        cabangId: data.cabangId,
      },
    });

    if (existingProduk) {
      throw new ResponseError(409, "Product already exists for this branch");
    }

    // Create the product
    const newProduk = await tx.produk.create({
      data: {
        produkMasterId: data.produkMasterId,
        cabangId: data.cabangId,
        hargaBeli: data.hargaBeli,
        hargaJual: data.hargaJual,
        hargaGrosir: data.hargaGrosir,
        stok: data.stok || 0,
        minStok: data.minStok,
        maxStok: data.maxStok,
        created_by: userName,
        updated_by: userName,
        created_by_user_Id: userId,
        updated_by_user_Id: userId,
        status: data.status || "tersedia",
      },
    });

    // Create price history records for each price type
    // For purchase price (hargaBeli)
    await tx.produkPriceHistory.create({
      data: {
        produkId: newProduk.id,
        cabangId: data.cabangId,
        tipeHarga: "beli",
        hargaLama: 0,
        hargaBaru: data.hargaBeli,
        tanggalPerubahan: new Date(),
        alasanPerubahan: "Initial price set",
        created_by: userName,
        updated_by: userName,
        created_by_user_Id: userId,
        updated_by_user_Id: userId,
      },
    });

    // For selling price (hargaJual)
    await tx.produkPriceHistory.create({
      data: {
        produkId: newProduk.id,
        cabangId: data.cabangId,
        tipeHarga: "jual",
        hargaLama: 0,
        hargaBaru: data.hargaJual,
        tanggalPerubahan: new Date(),
        alasanPerubahan: "Initial price set",
        created_by: userName,
        updated_by: userName,
        created_by_user_Id: userId,
        updated_by_user_Id: userId,
      },
    });

    // For wholesale price (hargaGrosir) if provided
    if (data.hargaGrosir) {
      await tx.produkPriceHistory.create({
        data: {
          produkId: newProduk.id,
          cabangId: data.cabangId,
          tipeHarga: "grosir",
          hargaLama: 0,
          hargaBaru: data.hargaGrosir,
          tanggalPerubahan: new Date(),
          alasanPerubahan: "Initial price set",
          created_by: userName,
          updated_by: userName,
          created_by_user_Id: userId,
          updated_by_user_Id: userId,
        },
      });
    }

    // Create audit log
    await createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: data.cabangId,
      action: "CREATE",
      tableName: "produk",
      recordId: newProduk.id,
      oldValues: null,
      newValues: data,
    });

    // Return the created product with related data
    return tx.produk.findFirst({
      where: { id: newProduk.id },
      include: {
        produkMaster: {
          include: {
            kategori: true,
            produkImage: true,
          },
        },
        cabang: true,
      },
    });
  });

  // Simpan ke cache
  const cacheKey = createCacheKey("produk", newProduk.id);
  await cacheSet(cacheKey, newProduk, 3600);

  // Cache untuk relasi master-cabang
  const masterCabangKey = createCacheKey(
    "produk-master-cabang",
    `${newProduk.produkMasterId}:${newProduk.cabangId}`
  );
  await cacheSet(masterCabangKey, newProduk, 3600);

  // Invalidasi cache daftar produk
  await cacheDeletePattern("produk-list:*");

  // Invalidasi cache produk dengan stok rendah
  await cacheDeletePattern(`low-stock-products:${newProduk.cabangId}:*`);

  return newProduk;
};

// Update product
const updateProduk = async (id, data, { userId, userName, ipAddress }) => {
  const updatedProduk = await prisma.$transaction(async (tx) => {
    // Get existing product
    const existingProduk = await tx.produk.findUnique({
      where: { id },
      include: {
        produkPriceHistory: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!existingProduk) {
      throw new ResponseError(404, "Product not found");
    }

    // Check if price changed to create history
    // Only check if the field is actually provided (not undefined)
    const isPriceChanged =
      (data.hargaBeli !== undefined && existingProduk.hargaBeli !== data.hargaBeli) ||
      (data.hargaJual !== undefined && existingProduk.hargaJual !== data.hargaJual) ||
      (data.hargaGrosir !== undefined &&
        ((existingProduk.hargaGrosir || null) !== (data.hargaGrosir || null) &&
         existingProduk.hargaGrosir?.toString() !== data.hargaGrosir?.toString()));

    // Make sure we have the user ID for price history
    if (!userId) {
      throw new ResponseError(400, "User ID is required for price updates");
    }

    // Build update data object with only provided fields
    const updateData = {
      updated_by: userName,
      updated_by_user_Id: userId,
    };

    // Only include fields that are explicitly provided
    if (data.hargaBeli !== undefined) updateData.hargaBeli = data.hargaBeli;
    if (data.hargaJual !== undefined) updateData.hargaJual = data.hargaJual;
    if (data.hargaGrosir !== undefined) updateData.hargaGrosir = data.hargaGrosir;
    if (data.minStok !== undefined) updateData.minStok = data.minStok;
    if (data.maxStok !== undefined) updateData.maxStok = data.maxStok;
    if (data.status !== undefined) updateData.status = data.status;

    // Update the product
    const updatedProduk = await tx.produk.update({
      where: { id },
      data: updateData,
    });

    // If price changed, create price history records for each changed price
    if (isPriceChanged) {
      const now = new Date();
      const alasan = data.alasanPerubahan || "Price update";
      const dokumenRef = data.dokumenReferensi || null;
      const supplierId = data.supplierId || null;

      // For purchase price (hargaBeli)
      if (data.hargaBeli !== undefined && existingProduk.hargaBeli !== data.hargaBeli) {
        await tx.produkPriceHistory.create({
          data: {
            produkId: id,
            cabangId: existingProduk.cabangId,
            tipeHarga: "beli",
            hargaLama: existingProduk.hargaBeli,
            hargaBaru: data.hargaBeli,
            tanggalPerubahan: now,
            alasanPerubahan: alasan,
            dokumenReferensi: dokumenRef,
            supplierId: supplierId,
            created_by: userName,
            updated_by: userName,
            created_by_user_Id: userId,
            updated_by_user_Id: userId,
          },
        });
      }

      // For selling price (hargaJual)
      if (data.hargaJual !== undefined && existingProduk.hargaJual !== data.hargaJual) {
        await tx.produkPriceHistory.create({
          data: {
            produkId: id,
            cabangId: existingProduk.cabangId,
            tipeHarga: "jual",
            hargaLama: existingProduk.hargaJual,
            hargaBaru: data.hargaJual,
            tanggalPerubahan: now,
            alasanPerubahan: alasan,
            dokumenReferensi: dokumenRef,
            supplierId: supplierId,
            created_by: userName,
            updated_by: userName,
            created_by_user_Id: userId,
            updated_by_user_Id: userId,
          },
        });
      }

      // For wholesale price (hargaGrosir)
      // Only process if hargaGrosir is explicitly provided
      if (data.hargaGrosir !== undefined) {
        // Handle null cases properly
        const oldGrosir = existingProduk.hargaGrosir || null;
        const newGrosir = data.hargaGrosir || null;

        if (
          oldGrosir !== newGrosir ||
          oldGrosir?.toString() !== newGrosir?.toString()
        ) {
          await tx.produkPriceHistory.create({
            data: {
              produkId: id,
              cabangId: existingProduk.cabangId,
              tipeHarga: "grosir",
              hargaLama: oldGrosir || 0,
              hargaBaru: newGrosir || 0,
              tanggalPerubahan: now,
              alasanPerubahan: alasan,
              dokumenReferensi: dokumenRef,
              supplierId: supplierId,
              created_by: userName,
              updated_by: userName,
              created_by_user_Id: userId,
              updated_by_user_Id: userId,
            },
          });
        }
      }
    }

    // Create audit log
    await createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: existingProduk.cabangId,
      action: "UPDATE",
      tableName: "produk",
      recordId: id,
      oldValues: {
        hargaBeli: existingProduk.hargaBeli,
        hargaJual: existingProduk.hargaJual,
        hargaGrosir: existingProduk.hargaGrosir,
        minStok: existingProduk.minStok,
        maxStok: existingProduk.maxStok,
        status: existingProduk.status,
      },
      newValues: data,
    });

    // Return the updated product with related data
    return tx.produk.findFirst({
      where: { id },
      include: {
        produkMaster: {
          include: {
            kategori: true,
            produkImage: true,
          },
        },
        cabang: true,
        produkPriceHistory: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });
  });

  // Update cache
  const cacheKey = createCacheKey("produk", id);
  await cacheSet(cacheKey, updatedProduk, 3600);

  // Update cache untuk relasi master-cabang
  const masterCabangKey = createCacheKey(
    "produk-master-cabang",
    `${updatedProduk.produkMasterId}:${updatedProduk.cabangId}`
  );
  await cacheSet(masterCabangKey, updatedProduk, 3600);

  // Invalidasi cache daftar
  await cacheDeletePattern("produk-list:*");

  // Invalidasi cache produk dengan stok rendah
  await cacheDeletePattern(`low-stock-products:${updatedProduk.cabangId}:*`);

  return updatedProduk;
};

// Update stock
const updateStok = async (id, data, { userId, userName, ipAddress }) => {
  if (!userId) {
    throw new ResponseError(400, "User ID is required for inventory updates");
  }

  const updatedProduk = await prisma.$transaction(async (tx) => {
    // Get existing product
    const existingProduk = await tx.produk.findUnique({
      where: { id },
      include: {
        produkMaster: true,
      },
    });

    if (!existingProduk) {
      throw new ResponseError(404, "Product not found");
    }

    const oldStock = existingProduk.stok || 0;
    const newStock = oldStock + data.quantity;

    // Update the product stock
    const updatedProduk = await tx.produk.update({
      where: { id },
      data: {
        stok: newStock,
      },
    });

    // Create inventory movement record
    await tx.inventoryMovement.create({
      data: {
        produkId: id,
        cabangId: existingProduk.cabangId,
        referenceId: data.referenceId || id, // Use provided reference or fallback to product ID
        referenceType: data.referenceType || "MANUAL", // Use provided type or default to MANUAL
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        expiredDate: data.expiredDate,
        keterangan: data.keterangan,
        userId: userId,
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: existingProduk.cabangId,
      action: "UPDATE",
      tableName: "produk",
      recordId: id,
      oldValues: { stok: oldStock },
      newValues: { stok: newStock, movementDetails: data },
    });

    // Return the updated product with related data
    return tx.produk.findFirst({
      where: { id },
      include: {
        produkMaster: true,
        cabang: true,
      },
    });
  });

  // Update cache
  const cacheKey = createCacheKey("produk", id);
  await cacheSet(cacheKey, updatedProduk, 3600);

  // Update cache untuk relasi master-cabang
  const masterCabangKey = createCacheKey(
    "produk-master-cabang",
    `${updatedProduk.produkMasterId}:${updatedProduk.cabangId}`
  );
  await cacheSet(masterCabangKey, updatedProduk, 3600);

  // Invalidasi cache daftar produk
  await cacheDeletePattern("produk-list:*");

  // Invalidasi cache inventory movement
  await cacheDeletePattern(`inventory-movements:${id}:*`);

  // Invalidasi cache produk dengan stok rendah
  await cacheDeletePattern(`low-stock-products:${updatedProduk.cabangId}:*`);

  // Invalidasi cache dashboard yang menampilkan produk stok rendah
  await cacheDeletePattern(`dashboard:*:${updatedProduk.cabangId}`);

  return updatedProduk;
};

// Get inventory movement history
const getInventoryMovements = async (produkId, { page = 1, limit = 10 }) => {
  const cacheKey = createCacheKey(
    "inventory-movements",
    `${produkId}:page:${page}:limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const [total, movements] = await Promise.all([
        prisma.inventoryMovement.count({
          where: { produkId },
        }),
        prisma.inventoryMovement.findMany({
          where: { produkId },
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
            cabang: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take,
        }),
      ]);

      if (!movements) {
        throw new ResponseError(404, "Inventory movement not found");
      }

      const totalPages = Math.ceil(total / limit);

      return {
        data: movements,
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
    300
  ); // Cache 5 menit
};

// Get price history
const getPriceHistory = async (produkId, { page = 1, limit = 10 }) => {
  const cacheKey = createCacheKey(
    "price-history",
    `${produkId}:page:${page}:limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const [total, priceHistory] = await Promise.all([
        prisma.produkPriceHistory.count({
          where: { produkId },
        }),
        prisma.produkPriceHistory.findMany({
          where: { produkId },
          select: {
            id: true,
            tipeHarga: true,
            tanggalPerubahan: true,
            hargaBaru: true,
            hargaLama: true,
            alasanPerubahan: true,
            dokumenReferensi: true,
            created_by_user_Id: true,
            created_by: true,
            updated_by_user_Id: true,
            updated_by: true,
            deleted_by_user_Id: true,
            deleted_by: true,
            cabangId: true,
            createdAt: true,
            supplier: true,
            cabang: true,
          },
          orderBy: {
            tanggalPerubahan: "desc",
          },
          skip,
          take,
        }),
      ]);

      if (!priceHistory) {
        throw new ResponseError(404, "Price history not found");
      }

      const totalPages = Math.ceil(total / limit);

      return {
        data: priceHistory,
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
    600
  ); // Cache 10 menit
};

// Get products with low stock
const getLowStockProducts = async (cabangId, { page = 1, limit = 10 }) => {
  const cacheKey = createCacheKey(
    "low-stock-products",
    `${cabangId}:page:${page}:limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const where = {
        cabangId,
        minStok: {
          not: null,
        },
      };

      // Add condition for stok < minStok
      where.stok = {
        lt: prisma.produk.fields.minStok,
      };

      const [total, data] = await Promise.all([
        prisma.produk.count({
          where,
        }),
        prisma.produk.findMany({
          where,
          include: {
            produkMaster: {
              include: {
                kategori: true,
                produkImage: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
          },
          skip,
          take,
          orderBy: [
            {
              stok: "asc",
            },
            {
              updatedAt: "desc",
            },
          ],
        }),
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
    },
    180
  ); // Cache 3 menit
};
  
    /**
   * Mendapatkan rekomendasi produk master untuk ditambahkan ke cabang
   * @param {String} cabangId - ID cabang yang akan ditambahkan produk
   * @param {Number} limit - Batas jumlah produk yang akan direkomendasikan
   * @param {String} kategoriId - ID kategori untuk filter (opsional)
   * @param {String} search - Kata kunci pencarian (opsional)
   * @param {Number} page - Halaman yang diminta (default: 1)
   */
    const getProductRecommendationsForBranch = async (cabangId, limit = 20, kategoriId = null, search = null, page = 1) => {
      if (!cabangId) {
        throw new Error("cabangId is required");
      }
      
      // Convert limit and page to numbers to ensure proper calculation
      limit = Number(limit);
      page = Number(page);
      
      // Validasi cabang
      const currentBranch = await prisma.cabang.findUnique({
        where: { id: cabangId },
        select: { 
          id: true,
          namaCabang: true,
          status: true,
        },
      });
      
      if (!currentBranch) {
        throw new Error("Branch not found");
      }
      
      // Create the WHERE clause
      let whereClause = `target_cabang_id = '${cabangId}'`;
      
      if (kategoriId) {
        whereClause += ` AND kategori_id = '${kategoriId}'`;
      }
      
      // Add search filter if provided
      if (search) {
        whereClause += ` AND (
          LOWER(nama_produk) LIKE LOWER('%${search}%') OR 
          LOWER(sku) LIKE LOWER('%${search}%')
        )`;
      }
      
      // Count total items for pagination
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) AS total 
        FROM mv_product_branch_recommendations 
        WHERE ${Prisma.raw(whereClause)}
      `;
      
      const totalCount = Number(countResult[0].total);
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      
      // Fetch data with pagination
      const rawRecommendations = await prisma.$queryRaw`
        SELECT 
          id, 
          nama_produk AS "namaProduk", 
          sku, 
          kategori_id AS "kategoriId", 
          nama_kategori AS "namaKategori", 
          gambar, 
          satuan, 
          CAST(total_terjual AS FLOAT) AS "totalTerjual", 
          CAST(rekomendasi_harga_beli AS FLOAT) AS "rekomendasiHargaBeli", 
          CAST(rekomendasi_harga_jual AS FLOAT) AS "rekomendasiHargaJual", 
          CAST(rekomendasi_stok_awal AS FLOAT) AS "rekomendasiStokAwal", 
          CAST(popularitas_score AS FLOAT) AS "popularitasScore" 
        FROM mv_product_branch_recommendations 
        WHERE ${Prisma.raw(whereClause)}
        ORDER BY popularitas_score DESC, created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
      
      // Convert BigInt to regular numbers
      const recommendations = rawRecommendations.map(item => {
        return Object.fromEntries(
          Object.entries(item).map(([key, value]) => {
            // Convert BigInt to Number
            if (typeof value === 'bigint') {
              return [key, Number(value)];
            }
            return [key, value];
          })
        );
      });
      
      // Format response with pagination info
      return {
        data: recommendations,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        }
      };
    };
  
  /**
   * Mendapatkan template produk untuk cabang
   * @param {String} kategoriId - ID kategori untuk filter template (opsional)
   */
  const getProductTemplates = async (kategoriId = null) => {
    // Dapatkan kategori yang ada di database
    const categories = await prisma.kategori.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        namaKategori: true,
      },
    });
    
    // Buat mapping kategori ID ke nama
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.namaKategori;
    });
    
    // Buat template berdasarkan kategori yang ada
    const templates = [
      {
        id: "template-general",
        name: "Template Umum",
        description: "Template umum untuk semua jenis produk",
        defaultValues: {
          marginPercentage: 20, // 20% margin
          minStok: 5,
          maxStok: 50,
          status: "tersedia",
        },
        kategoriIds: categories.map(c => c.id), // Semua kategori
      },
      {
        id: "template-grocery",
        name: "Produk Grocery",
        description: "Template untuk produk grocery dan kebutuhan sehari-hari",
        defaultValues: {
          marginPercentage: 15, // 15% margin
          minStok: 10,
          maxStok: 100,
          status: "tersedia",
        },
        kategoriIds: categories
          .filter(c => c.namaKategori.toLowerCase().includes("grocery") || 
                       c.namaKategori.toLowerCase().includes("makanan") ||
                       c.namaKategori.toLowerCase().includes("minuman"))
          .map(c => c.id),
      },
      {
        id: "template-electronics",
        name: "Produk Elektronik",
        description: "Template untuk produk elektronik",
        defaultValues: {
          marginPercentage: 25, // 25% margin
          minStok: 3,
          maxStok: 20,
          status: "tersedia",
        },
        kategoriIds: categories
          .filter(c => c.namaKategori.toLowerCase().includes("elektronik") || 
                       c.namaKategori.toLowerCase().includes("gadget"))
          .map(c => c.id),
      },
      {
        id: "template-fashion",
        name: "Produk Fashion",
        description: "Template untuk produk fashion dan pakaian",
        defaultValues: {
          marginPercentage: 40, // 40% margin
          minStok: 5,
          maxStok: 50,
          status: "tersedia",
        },
        kategoriIds: categories
          .filter(c => c.namaKategori.toLowerCase().includes("fashion") || 
                       c.namaKategori.toLowerCase().includes("pakaian") ||
                       c.namaKategori.toLowerCase().includes("baju"))
          .map(c => c.id),
      },
      {
        id: "template-perishable",
        name: "Produk Mudah Rusak",
        description: "Template untuk produk dengan masa simpan pendek",
        defaultValues: {
          marginPercentage: 30, // 30% margin
          minStok: 5,
          maxStok: 30,
          status: "tersedia",
        },
        kategoriIds: categories
          .filter(c => c.namaKategori.toLowerCase().includes("segar") || 
                       c.namaKategori.toLowerCase().includes("buah") ||
                       c.namaKategori.toLowerCase().includes("sayur"))
          .map(c => c.id),
      },
    ];
    
    // Filter template berdasarkan kategori jika ada
    if (kategoriId) {
      return templates.filter(template => 
        template.kategoriIds.includes(kategoriId)
      );
    }
    
    return templates;
  }
  
  /**
   * Memproses penambahan produk secara massal ke cabang
   * @param {String} cabangId - ID cabang yang akan ditambahkan produk
   * @param {Array} produkMasterIds - Array ID produk master yang akan ditambahkan
   * @param {Object} defaultValues - Nilai default untuk semua produk
   * @param {Object} auditInfo - Informasi untuk audit log
   */
  const bulkAddProductsToBranch = async (cabangId, products, defaultValues, auditInfo) => {
    if (!cabangId || !products || products.length === 0) {
      throw new Error("cabangId and products are required");
    }
    
    // 1. Validasi cabang
    const cabang = await prisma.cabang.findUnique({
      where: { 
        id: cabangId,
        deletedAt: null,
        status: "aktif"
      },
    });
    
    if (!cabang) {
      throw new Error("Branch not found or inactive");
    }
    
    // Extract produkMasterIds from products array
    const produkMasterIds = products.map(product => 
      typeof product === 'string' ? product : product.produkMasterId
    );
    
    // Create a map for quick lookup of product configurations
    const productConfigMap = {};
    products.forEach(product => {
      if (typeof product !== 'string') {
        productConfigMap[product.produkMasterId] = product;
      }
    });
    
    // 2. Dapatkan produk master yang sudah ada di cabang
    const existingProducts = await prisma.produk.findMany({
      where: {
        cabangId,
        produkMasterId: { in: produkMasterIds },
      },
      select: {
        produkMasterId: true,
      },
    });
    
    const existingProductMasterIds = existingProducts.map(p => p.produkMasterId);
    
    // 3. Filter produk master yang belum ada di cabang
    const newProductMasterIds = produkMasterIds.filter(
      id => !existingProductMasterIds.includes(id)
    );
    
    if (newProductMasterIds.length === 0) {
      return {
        success: false,
        message: "All products already exist in this branch",
        addedProducts: 0,
        skippedProducts: produkMasterIds.length,
      };
    }
    
    // 4. Dapatkan detail produk master
    const productMasters = await prisma.produkMaster.findMany({
      where: {
        id: { in: newProductMasterIds },
        deletedAt: null,
      },
    });
    
    // 5. Buat produk di cabang untuk setiap produk master
    const createdProducts = [];
    const skippedProducts = [];
    
    // Gunakan transaction untuk memastikan semua operasi berhasil
    await prisma.$transaction(async (prisma) => {
      for (const productMaster of productMasters) {
        try {
          // Get product-specific configuration if available
          const productConfig = productConfigMap[productMaster.id] || {};
          
          // Use product-specific values or fall back to default values
          const hargaBeli = productConfig.hargaBeli || defaultValues.hargaBeli || 0;
          let hargaJual = productConfig.hargaJual;
          
          // Calculate selling price based on margin if not explicitly provided
          if (!hargaJual) {
            const marginPercentage = productConfig.marginPercentage || defaultValues.marginPercentage;
            if (marginPercentage && hargaBeli) {
              const margin = (hargaBeli * marginPercentage) / 100;
              hargaJual = hargaBeli + margin;
            } else {
              hargaJual = defaultValues.hargaJual || 0;
            }
          }
          
          // Buat produk baru di cabang
          const newProduct = await prisma.produk.create({
            data: {
              produkMasterId: productMaster.id,
              cabangId: cabangId,
              hargaBeli: hargaBeli,
              hargaJual: hargaJual,
              hargaGrosir: productConfig.hargaGrosir || defaultValues.hargaGrosir || null,
              stok: productConfig.stok || defaultValues.stok || 0,
              minStok: productConfig.minStok || defaultValues.minStok || 0,
              maxStok: productConfig.maxStok || defaultValues.maxStok || 100,
              status: productConfig.status || defaultValues.status || "tersedia",
              created_by: auditInfo.userName,
              updated_by: auditInfo.userName,
              created_by_user_Id: auditInfo.userId,
              updated_by_user_Id: auditInfo.userId,
            },
          });
          
          // Buat history harga
          await prisma.produkPriceHistory.create({
            data: {
              produkId: newProduct.id,
              hargaLama: 0,
              hargaBaru: hargaJual,
              tipeHarga: "jual",
              alasanPerubahan: "Harga awal",
              created_by: auditInfo.userName,
              updated_by: auditInfo.userName,
              created_by_user_Id: auditInfo.userId,
              updated_by_user_Id: auditInfo.userId,
              cabangId: cabangId,
              tanggalPerubahan: new Date(),
            },
          });
          
          await prisma.produkPriceHistory.create({
            data: {
              produkId: newProduct.id,
              hargaLama: 0,
              hargaBaru: hargaBeli,
              tipeHarga: "beli",
              alasanPerubahan: "Harga awal",
              created_by: auditInfo.userName,
              updated_by: auditInfo.userName,
              created_by_user_Id: auditInfo.userId,
              updated_by_user_Id: auditInfo.userId,
              cabangId: cabangId,
              tanggalPerubahan: new Date(),
            },
          });
          
          // Buat inventory movement jika stok awal > 0
          if (defaultValues.stok > 0) {
            await prisma.inventoryMovement.create({
              data: {
                produkId: newProduct.id,
                jumlahSebelum: 0,
                jumlahPerubahan: defaultValues.stok,
                jumlahSetelah: defaultValues.stok,
                tipe: "in",
                keterangan: "Harga Awal",
                userId: auditInfo.userId,
                cabangId: cabangId,
              },
            });
          }
          
          // Buat audit log
          await prisma.auditLog.create({
            data: {
              user_id: auditInfo.userId,
              created_by: auditInfo.userName,
              action: "CREATE",
              table_name: "produk",
              record_id: newProduct.id,
              old_values: null,
              new_values: JSON.stringify(newProduct),
              ip_address: auditInfo.ipAddress || null,
              cabang_id: cabangId,
            },
          });
          
          createdProducts.push({
            id: newProduct.id,
            produkMasterId: productMaster.id,
            namaProduk: productMaster.namaProduk,
          });
        } catch (error) {
          // Log error dan lanjutkan ke produk berikutnya
          console.error(`Error adding product ${productMaster.id} to branch ${cabangId}:`, error);
          skippedProducts.push({
            produkMasterId: productMaster.id,
            namaProduk: productMaster.namaProduk,
            error: error.message,
          });
        }
      }
    });
    
    // 6. Hapus cache terkait
    await cacheDeletePattern(`product-*-${cabangId}`);
    await cacheDeletePattern(`product-dashboard-*-${cabangId}`);
    
    return {
      success: true,
      message: `Successfully added ${createdProducts.length} products to branch`,
      addedProducts: createdProducts.length,
      skippedProducts: skippedProducts.length,
      createdProducts,
      skippedProducts,
    };
  }
  

// Tambahkan fungsi untuk invalidasi cache
const invalidateProdukCache = async (id = null, cabangId = null) => {
  if (id) {
    // Hapus cache untuk produk spesifik
    await cacheDelete(createCacheKey("produk", id));
    await cacheDeletePattern("inventory-movements:" + id + ":*");
    await cacheDeletePattern("price-history:" + id + ":*");
  } else {
    // Hapus semua cache produk
    await cacheDeletePattern("produk:*");
    await cacheDeletePattern("produk-list:*");
    await cacheDeletePattern("produk-master-cabang:*");
    await cacheDeletePattern("inventory-movements:*");
    await cacheDeletePattern("price-history");
  }

  if (cabangId) {
    // Hapus cache produk stok rendah untuk cabang tertentu
    await cacheDeletePattern("low-stock-products:" + cabangId + ":*");
  } else {
    // Hapus semua cache produk stok rendah
    await cacheDeletePattern("low-stock-products:*");
  }

  // Invalidasi cache dashboard yang terkait
  await cacheDeletePattern("dashboard:*");
};

module.exports = {
  getAllProduk,
  getProdukById,
  getProdukByMasterAndCabang,
  createProduk,
  updateProduk,
  updateStok,
  getInventoryMovements,
  getPriceHistory,
  getLowStockProducts,
  getProductTemplates,
  bulkAddProductsToBranch,
  getProductRecommendationsForBranch,
  invalidateProdukCache,
  searchProducts,
  getProductByBarcode,
  getFrequentlyUsedProducts
};
