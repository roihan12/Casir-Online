const { basePrisma } = require("../config/db");
const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const {
  cacheOrFetch,
  createCacheKey,
} = require("../utils/redisUtils");

/**
 * E-Catalog Service — Public, no auth required
 * Provides product catalog browsing for online customers
 *
 * IMPORTANT: Tabel `produk` punya RLS policy yang membutuhkan
 * `app.current_cabang_ids` session variable. Karena catalog endpoint
 * adalah public (tanpa auth), kita harus SET LOCAL secara manual
 * menggunakan cabangId dari URL parameter.
 */

/**
 * Helper: Run Prisma query inside a transaction with RLS context set
 * For public catalog queries that need to access RLS-protected tables
 */
const withPublicRls = async (cabangId, callback) => {
  return basePrisma.$transaction(async (tx) => {
    // Set session variable so RLS policy allows SELECT on produk table
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_cabang_ids = '${cabangId.replace(/'/g, "''")}'`
    );
    return callback(tx);
  });
};

/**
 * Get catalog products for a specific branch
 */
const getCatalogProducts = async (cabangId, filters = {}) => {
  const {
    search = "",
    kategoriId,
    sortBy = "terbaru",
    page = 1,
    limit = 12,
    minPrice,
    maxPrice,
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const where = {
    cabangId,
    status: "tersedia",
    stok: { gt: 0 },
    deletedAt: null,
    produkMaster: {
      status: "aktif",
      deletedAt: null,
    },
  };

  // Search by product name, SKU, or barcode
  if (search) {
    where.produkMaster = {
      ...where.produkMaster,
      OR: [
        { namaProduk: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  // Filter by category
  if (kategoriId) {
    where.produkMaster = {
      ...where.produkMaster,
      kategoriId,
    };
  }

  // Price range filter
  if (minPrice !== undefined) {
    where.hargaJual = { ...where.hargaJual, gte: minPrice };
  }
  if (maxPrice !== undefined) {
    where.hargaJual = { ...where.hargaJual, lte: maxPrice };
  }

  // Build orderBy
  let orderBy = {};
  switch (sortBy) {
    case "nama":
      orderBy = { produkMaster: { namaProduk: "asc" } };
      break;
    case "harga_asc":
      orderBy = { hargaJual: "asc" };
      break;
    case "harga_desc":
      orderBy = { hargaJual: "desc" };
      break;
    case "terbaru":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const [products, totalCount] = await withPublicRls(cabangId, async (tx) => {
    return Promise.all([
      tx.produk.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          hargaJual: true,
          hargaGrosir: true,
          stok: true,
          produkMaster: {
            select: {
              id: true,
              namaProduk: true,
              sku: true,
              barcode: true,
              deskripsi: true,
              brand: true,
              satuan: true,
              berat: true,
              kategoriId: true,
              kategori: {
                select: {
                  id: true,
                  namaKategori: true,
                },
              },
              produkImage: {
                select: {
                  id: true,
                  fileName: true,
                  filePath: true,
                  isPrimary: true,
                  urutan: true,
                },
                orderBy: [{ isPrimary: "desc" }, { urutan: "asc" }],
              },
            },
          },
        },
      }),
      tx.produk.count({ where }),
    ]);
  });

  return {
    data: products.map((p) => ({
      produk_id: p.id,
      produk_master_id: p.produkMaster.id,
      nama_produk: p.produkMaster.namaProduk,
      sku: p.produkMaster.sku,
      barcode: p.produkMaster.barcode,
      deskripsi: p.produkMaster.deskripsi,
      brand: p.produkMaster.brand,
      satuan: p.produkMaster.satuan,
      berat: p.produkMaster.berat,
      harga_jual: p.hargaJual,
      harga_grosir: p.hargaGrosir,
      stok: p.stok,
      kategori: p.produkMaster.kategori
        ? {
            id: p.produkMaster.kategori.id,
            nama: p.produkMaster.kategori.namaKategori,
          }
        : null,
      images: p.produkMaster.produkImage.map((img) => ({
        id: img.id,
        file_name: img.fileName,
        file_path: img.filePath,
        is_primary: img.isPrimary,
      })),
    })),
    pagination: {
      page,
      limit,
      totalData: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Get product detail for e-catalog
 */
const getProductDetail = async (produkId, cabangId) => {
  // cabangId comes from URL parameter — no need to query RLS-protected table
  const product = await withPublicRls(cabangId, async (tx) => {
    return tx.produk.findFirst({
      where: {
        id: produkId,
        status: "tersedia",
        deletedAt: null,
        produkMaster: {
          status: "aktif",
          deletedAt: null,
        },
      },
      select: {
        id: true,
        cabangId: true,
        hargaJual: true,
        hargaGrosir: true,
        stok: true,
        produkMaster: {
          select: {
            id: true,
            namaProduk: true,
            sku: true,
            barcode: true,
            deskripsi: true,
            brand: true,
            satuan: true,
            berat: true,
            dimensiP: true,
            dimensiL: true,
            dimensiT: true,
            kategoriId: true,
            kategori: {
              select: {
                id: true,
                namaKategori: true,
              },
            },
            produkImage: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
                isPrimary: true,
                urutan: true,
              },
              orderBy: [{ isPrimary: "desc" }, { urutan: "asc" }],
            },
          },
        },
      },
    });
  });

  if (!product) {
    throw new ResponseError(404, "Produk tidak ditemukan");
  }

  return {
    produk_id: product.id,
    cabang_id: product.cabangId,
    produk_master_id: product.produkMaster.id,
    nama_produk: product.produkMaster.namaProduk,
    sku: product.produkMaster.sku,
    barcode: product.produkMaster.barcode,
    deskripsi: product.produkMaster.deskripsi,
    brand: product.produkMaster.brand,
    satuan: product.produkMaster.satuan,
    berat: product.produkMaster.berat,
    dimensi: {
      panjang: product.produkMaster.dimensiP,
      lebar: product.produkMaster.dimensiL,
      tinggi: product.produkMaster.dimensiT,
    },
    harga_jual: product.hargaJual,
    harga_grosir: product.hargaGrosir,
    stok: product.stok,
    kategori: product.produkMaster.kategori
      ? {
          id: product.produkMaster.kategori.id,
          nama: product.produkMaster.kategori.namaKategori,
        }
      : null,
    images: product.produkMaster.produkImage.map((img) => ({
      id: img.id,
      file_name: img.fileName,
      file_path: img.filePath,
      is_primary: img.isPrimary,
    })),
  };
};

/**
 * Get categories for a branch catalog
 */
const getCatalogCategories = async (cabangId) => {
  // Get categories that have active products in this branch
  // kategori table itself may not have RLS, but the nested produk does
  // Use withPublicRls to ensure produk counts work correctly
  const categories = await withPublicRls(cabangId, async (tx) => {
    return tx.kategori.findMany({
      where: {
        status: "aktif",
        deletedAt: null,
        produkMaster: {
          some: {
            status: "aktif",
            deletedAt: null,
            produk: {
              some: {
                cabangId,
                status: "tersedia",
                stok: { gt: 0 },
                deletedAt: null,
              },
            },
          },
        },
      },
      select: {
        id: true,
        namaKategori: true,
        deskripsi: true,
        _count: {
          select: {
            produkMaster: {
              where: {
                status: "aktif",
                deletedAt: null,
                produk: {
                  some: {
                    cabangId,
                    status: "tersedia",
                    stok: { gt: 0 },
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { namaKategori: "asc" },
    });
  });

  return categories.map((cat) => ({
    id: cat.id,
    nama: cat.namaKategori,
    deskripsi: cat.deskripsi,
    jumlah_produk: cat._count.produkMaster,
  }));
};

/**
 * Get branch info for catalog header
 */
const getCabangInfo = async (cabangId) => {
  const cabang = await prisma.cabang.findFirst({
    where: {
      id: cabangId,
      status: "aktif",
    },
    select: {
      id: true,
      namaCabang: true,
      alamat: true,
      telepon: true,
      operationalHours: {
        select: {
          dayOfWeek: true,
          isOpen: true,
          openTime: true,
          closeTime: true,
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!cabang) {
    throw new ResponseError(404, "Toko tidak ditemukan");
  }

  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  return {
    id: cabang.id,
    nama: cabang.namaCabang,
    alamat: cabang.alamat,
    telepon: cabang.telepon,
    jam_operasional: cabang.operationalHours.map((oh) => ({
      hari: dayNames[oh.dayOfWeek] || `Hari ${oh.dayOfWeek}`,
      day_of_week: oh.dayOfWeek,
      buka: oh.isOpen,
      jam_buka: oh.openTime,
      jam_tutup: oh.closeTime,
    })),
  };
};

module.exports = {
  getCatalogProducts,
  getProductDetail,
  getCatalogCategories,
  getCabangInfo,
};
