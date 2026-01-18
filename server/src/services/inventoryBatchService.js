const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// Menambahkan stok dengan batch number dan expired date
const addProductBatch = async (data, auditInfo) => {
  const {
    produkId,
    batchNumber,
    expiredDate,
    quantity,
    hargaBeli,
    hargaJual,
    hargaGrosir,
    supplierId,
    dokumenReferensi,
    keterangan,
  } = data;

  // Cek produk
  const produk = await prisma.produk.findUnique({
    where: { id: produkId },
    include: {
      produkMaster: true,
      cabang: true,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan");
  }

  // Cek apakah produk mendukung expired date
  if (expiredDate && !produk.produkMaster.hasExpired) {
    throw new ResponseError(
      400,
      "Produk ini tidak mendukung tanggal kadaluarsa"
    );
  }

  // Validasi supplier jika ada
  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new ResponseError(404, "Supplier tidak ditemukan");
    }
  }

  // Generate reference ID untuk pergerakan stok
  const referenceId = `BATCH-${batchNumber}-${Date.now()}`;

  // Transaksi database
  const result = await prisma.$transaction(async (prisma) => {
    // Update stok produk
    const updatedProduk = await prisma.produk.update({
      where: { id: produkId },
      data: {
        stok: {
          increment: quantity,
        },
      },
    });

    // Catat pergerakan inventaris
    const movement = await prisma.inventoryMovement.create({
      data: {
        produkId,
        cabangId: produk.cabangId,
        referenceId,
        referenceType: "adjustment",
        quantity,
        batchNumber,
        expiredDate,
        keterangan: keterangan || `Penambahan batch ${batchNumber}`,
        userId: auditInfo.userId,
      },
    });

    // Perbarui harga jika ada perubahan
    let priceHistories = [];

    // Update harga beli jika berubah
    if (hargaBeli !== produk.hargaBeli) {
      const priceBuyHistory = await prisma.produkPriceHistory.create({
        data: {
          produkId,
          cabangId: produk.cabangId,
          tipeHarga: "beli",
          hargaLama: produk.hargaBeli,
          hargaBaru: hargaBeli,
          tanggalPerubahan: new Date(),
          alasanPerubahan: `Penambahan batch ${batchNumber}`,
          supplierId,
          dokumenReferensi,
          userId: auditInfo.userId,
        },
      });
      priceHistories.push(priceBuyHistory);

      // Update harga beli produk
      await prisma.produk.update({
        where: { id: produkId },
        data: { hargaBeli },
      });
    }

    // Update harga jual jika ada dan berubah
    if (hargaJual && hargaJual !== produk.hargaJual) {
      const priceSellHistory = await prisma.produkPriceHistory.create({
        data: {
          produkId,
          cabangId: produk.cabangId,
          tipeHarga: "jual",
          hargaLama: produk.hargaJual,
          hargaBaru: hargaJual,
          tanggalPerubahan: new Date(),
          alasanPerubahan: `Penambahan batch ${batchNumber}`,
          supplierId,
          dokumenReferensi,
          userId: auditInfo.userId,
        },
      });
      priceHistories.push(priceSellHistory);

      // Update harga jual produk
      await prisma.produk.update({
        where: { id: produkId },
        data: { hargaJual },
      });
    }

    // Update harga grosir jika ada dan berubah
    if (hargaGrosir && hargaGrosir !== produk.hargaGrosir) {
      const priceWholesaleHistory = await prisma.produkPriceHistory.create({
        data: {
          produkId,
          cabangId: produk.cabangId,
          tipeHarga: "grosir",
          hargaLama: produk.hargaGrosir || 0,
          hargaBaru: hargaGrosir,
          tanggalPerubahan: new Date(),
          alasanPerubahan: `Penambahan batch ${batchNumber}`,
          supplierId,
          dokumenReferensi,
          userId: auditInfo.userId,
        },
      });
      priceHistories.push(priceWholesaleHistory);

      // Update harga grosir produk
      await prisma.produk.update({
        where: { id: produkId },
        data: { hargaGrosir },
      });
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "ADD_PRODUCT_BATCH",
        table_name: "inventory_movement",
        record_id: movement.id,
        new_values: JSON.stringify({
          batch: { produkId, batchNumber, expiredDate, quantity },
          priceChanges: priceHistories.length > 0,
        }),
      },
    });

    // Kembalikan data lengkap
    const updatedProductWithDetails = await prisma.produk.findUnique({
      where: { id: produkId },
      include: {
        produkMaster: true,
        cabang: true,
      },
    });

    return {
      product: updatedProductWithDetails,
      batch: {
        batchNumber,
        expiredDate,
        quantity,
        referenceId,
      },
      movement,
      priceHistories,
    };
  });

  return result;
};

// Mendapatkan produk dengan stok yang hampir kadaluarsa
const getExpiringStock = async (filters) => {
  const { cabangId, page = 1, limit = 10 } = filters;


  const skip = (page - 1) * limit;

  // Count total records
  const totalCount = await prisma.$queryRaw`
    SELECT CAST(COUNT(*) AS INTEGER) AS total
    FROM vw_produk_akan_kadaluarsa
    WHERE cabang_id = ${cabangId}
  `;

  // Calculate pagination
  const totalPages = Math.ceil(totalCount[0].total / limit);

  const produkAkankadaluarsa = await prisma.$queryRaw`
SELECT
        v.produk_id,
        v.cabang_id,
        v.nama_cabang,
        v.nama_produk,
        v.sku,
        v.barcode,
        CAST(v.stok AS INTEGER) AS stok,
        v.tanggal_kedaluwarsa,
        CAST(v.harga_jual AS NUMERIC) AS harga_jual,
        v.status,
        v.tanggal_sekarang,
        CAST(v.hari_tersisa AS INTEGER) AS hari_tersisa,
        v.status_kadaluarsa
    FROM vw_produk_akan_kadaluarsa v
    WHERE v.cabang_id = ${cabangId}
    LIMIT ${limit}
    OFFSET ${skip}
  `;

  console.log("produkAkankadaluarsa", produkAkankadaluarsa);

  return {
    data: produkAkankadaluarsa,
    pagination: {
      totalItems: totalCount[0].total,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit)
      ,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan produk dengan stok di bawah minimum
const getMinimumStock = async (filters) => {
  const { cabangId, kategoriId, page = 1, limit = 10 } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    cabangId,
    minStok: {
      not: null,
    },
    stok: {
      lte: prisma.produk.fields.minStok, // Products where stock <= minStock
    },
  };

  // Add kategori filter if provided
  if (kategoriId) {
    where.produkMaster = {
      kategoriId,
    };
  }

  // Count total records
  const totalCount = await prisma.produk.count({ where });

  // Get products below minimum stock
  const lowStockProducts = await prisma.produk.findMany({
    where,
    include: {
      produkMaster: {
        include: {
          kategori: true,
        },
      },
      cabang: true,
    },
    orderBy: [
      {
        stok: "asc", // Most critical (lowest stock) first
      },
    ],
    skip,
    take: limit,
  });

  // Calculate deficit percentage
  const results = lowStockProducts.map((product) => {
    const currentStock = product.stok || 0;
    const minStock = product.minStok || 0;
    let deficitPercentage = 0;

    if (minStock > 0) {
      deficitPercentage = ((minStock - currentStock) / minStock) * 100;
    }

    return {
      ...product,
      deficitPercentage: Math.round(deficitPercentage),
      deficit: minStock - currentStock,
    };
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: results,
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

// Update pengaturan notifikasi stok untuk produk
const updateStockAlertSettings = async (data, auditInfo) => {
  const {
    produkId,
    cabangId,
    minStok,
    maxStok,
    notifyLowStock,
    notifyExpiringStock,
    expiryThresholdDays,
  } = data;

  // Check if product exists
  const produk = await prisma.produk.findFirst({
    where: {
      id: produkId,
      cabangId,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan di cabang ini");
  }

  // Prepare update data
  const updateData = {};
  if (minStok !== undefined) updateData.minStok = minStok;
  if (maxStok !== undefined) updateData.maxStok = maxStok;

  // In a real application, you would likely have additional fields in the Produk model
  // for notification settings, or a separate table for stock alert settings
  // For this example, we'll assume those fields exist
  if (notifyLowStock !== undefined) updateData.notifyLowStock = notifyLowStock;
  if (notifyExpiringStock !== undefined)
    updateData.notifyExpiringStock = notifyExpiringStock;
  if (expiryThresholdDays !== undefined)
    updateData.expiryThresholdDays = expiryThresholdDays;

  // Update product settings
  const updatedProduct = await prisma.produk.update({
    where: {
      id: produkId,
    },
    data: updateData,
    include: {
      produkMaster: true,
      cabang: true,
    },
  });

  // Add audit log
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "UPDATE_STOCK_ALERT_SETTINGS",
      table_name: "produk",
      record_id: produkId,
      old_values: JSON.stringify({
        minStok: produk.minStok,
        maxStok: produk.maxStok,
        // Add notification fields if they exist in your model
      }),
      new_values: JSON.stringify(updateData),
    },
  });

  return updatedProduct;
};

module.exports = {
  addProductBatch,
  getExpiringStock,
  getMinimumStock,
  updateStockAlertSettings,
};
