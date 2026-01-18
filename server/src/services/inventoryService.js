const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { cacheDeletePattern } = require("../utils/redisUtils");


// Service untuk pencatatan pergerakan stok
const createStockAdjustment = async (data, auditInfo) => {
  const {
    produkId,
    cabangId,
    quantity,
    batchNumber,
    expiredDate,
    keterangan,
    referenceType,
  } = data;

  // Cek apakah produk ada di cabang tersebut
  const produk = await prisma.produk.findFirst({
    where: {
      id: produkId,
      cabangId: cabangId,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan di cabang ini");
  }

  // Generate reference ID (untuk adjustment bisa menggunakan format ADJ-{timestamp})
  const referenceId = `ADJ-${Date.now()}`;

  // Buat inventory movement
  const movement = await prisma.inventoryMovement.create({
    data: {
      produkId,
      cabangId,
      referenceId,
      referenceType,
      quantity,
      batchNumber,
      expiredDate,
      keterangan,
      userId: auditInfo.userId,
    },
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
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
  });

  // Update stok produk
  await prisma.produk.update({
    where: {
      id: produkId,
    },
    data: {
      stok: {
        increment: quantity,
      },
    },
  });

  // Tambahkan log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "CREATE_INVENTORY_MOVEMENT",
      table_name: "inventory_movement",
      record_id: movement.id,
      new_values: JSON.stringify(movement),
    },
  });

  return movement;
};

// Mendapatkan riwayat pergerakan stok dengan filter
const getInventoryMovements = async (filters) => {
  const {
    produkId,
    cabangId,
    startDate,
    endDate,
    referenceType,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {};

  if (produkId) where.produkId = produkId;
  if (cabangId) where.cabangId = cabangId;
  if (referenceType) where.referenceType = referenceType;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Query untuk mendapatkan total count
  const totalCount = await prisma.inventoryMovement.count({ where });

  // Query untuk mendapatkan data dengan pagination
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
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: movements,
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

// Export inventory movements to CSV
const exportInventoryMovements = async (filters) => {
  const { produkId, cabangId, startDate, endDate, referenceType, type } =
    filters;

  // Membuat kondisi filter
  const where = {};

  if (produkId) where.produkId = produkId;
  if (cabangId) where.cabangId = cabangId;
  if (referenceType) where.referenceType = referenceType;
  if (type) where.type = type;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Query untuk mendapatkan data
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
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Generate CSV header row
  let csvContent =
    "ID,Tanggal,Produk,SKU,Tipe,Kuantitas,Stok Sebelum,Stok Sesudah,Alasan,Referensi,Batch,Kadaluarsa,Cabang,User\n";

  // Generate CSV data rows
  for (const movement of movements) {
    const row = [
      movement.id,
      formatDate(movement.createdAt),
      `"${(movement.produk?.produkMaster?.namaProduk || "").replace(
        /"/g,
        '""'
      )}"`,
      movement.produk?.produkMaster?.sku || "",
      movement.type || "",
      movement.quantity,
      movement.stockBefore || "",
      movement.stockAfter || "",
      `"${(movement.reason || "").replace(/"/g, '""')}"`,
      `"${(movement.referenceId || "").replace(/"/g, '""')}"`,
      movement.batchNumber || "",
      movement.expiredDate ? formatDate(movement.expiredDate) : "",
      movement.cabang?.namaCabang || "",
      movement.user?.namaLengkap || "",
    ].join(",");

    csvContent += row + "\n";
  }

  return csvContent;
};

// Generate inventory movement report in various formats
const generateMovementReport = async (filters) => {
  const {
    cabangId,
    produkId,
    startDate,
    endDate,
    referenceType,
    type,
    format = "detailed", // 'detailed', 'summary', 'batch'
    outputType = "pdf", // 'pdf', 'excel', 'csv'
  } = filters;

  // Membuat kondisi filter
  const where = {};

  if (produkId) where.produkId = produkId;
  if (cabangId) where.cabangId = cabangId;
  if (referenceType) where.referenceType = referenceType;
  if (type) where.type = type;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Query untuk mendapatkan data
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
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format data based on report type
  let reportData;

  switch (format) {
    case "summary":
      reportData = generateSummaryReport(movements);
      break;
    case "batch":
      reportData = generateBatchReport(movements);
      break;
    case "detailed":
    default:
      reportData = movements;
      break;
  }

  // Generate output in the requested format
  switch (outputType) {
    case "excel":
      return generateExcelReport(reportData, format);
    case "csv":
      return generateCSVReport(reportData, format);
    case "pdf":
    default:
      return generatePDFReport(reportData, format);
  }
};

// Helper function to generate summary report data
const generateSummaryReport = (movements) => {
  // Group by product
  const productSummary = {};

  for (const movement of movements) {
    const productId = movement.produkId;
    const productName = movement.produk?.produkMaster?.namaProduk || "Unknown";

    if (!productSummary[productId]) {
      productSummary[productId] = {
        productId,
        productName,
        totalInflow: 0,
        totalOutflow: 0,
        netChange: 0,
        movements: 0,
      };
    }

    const quantity = movement.quantity;
    if (quantity > 0) {
      productSummary[productId].totalInflow += quantity;
    } else {
      productSummary[productId].totalOutflow += Math.abs(quantity);
    }

    productSummary[productId].netChange += quantity;
    productSummary[productId].movements += 1;
  }

  return {
    summary: {
      totalProducts: Object.keys(productSummary).length,
      totalMovements: movements.length,
      dateRange: {
        start:
          movements.length > 0
            ? formatDate(movements[movements.length - 1].createdAt)
            : "",
        end: movements.length > 0 ? formatDate(movements[0].createdAt) : "",
      },
    },
    products: Object.values(productSummary),
  };
};

// Helper function to generate batch report data
const generateBatchReport = (movements) => {
  // Group by batch
  const batchSummary = {};

  for (const movement of movements) {
    const batchNumber = movement.batchNumber || "No Batch";

    if (!batchSummary[batchNumber]) {
      batchSummary[batchNumber] = {
        batchNumber,
        firstMovement: movement.createdAt,
        lastMovement: movement.createdAt,
        totalQuantity: 0,
        products: {},
        movements: [],
      };
    }

    // Update first and last movement dates
    if (movement.createdAt < batchSummary[batchNumber].firstMovement) {
      batchSummary[batchNumber].firstMovement = movement.createdAt;
    }
    if (movement.createdAt > batchSummary[batchNumber].lastMovement) {
      batchSummary[batchNumber].lastMovement = movement.createdAt;
    }

    // Update total quantity
    batchSummary[batchNumber].totalQuantity += movement.quantity;

    // Add product info
    const productId = movement.produkId;
    const productName = movement.produk?.produkMaster?.namaProduk || "Unknown";

    if (!batchSummary[batchNumber].products[productId]) {
      batchSummary[batchNumber].products[productId] = {
        productId,
        productName,
        quantity: 0,
      };
    }

    batchSummary[batchNumber].products[productId].quantity += movement.quantity;

    // Add movement to list
    batchSummary[batchNumber].movements.push(movement);
  }

  // Convert product objects to arrays
  Object.values(batchSummary).forEach((batch) => {
    batch.products = Object.values(batch.products);
  });

  return {
    summary: {
      totalBatches: Object.keys(batchSummary).length,
      totalMovements: movements.length,
      dateRange: {
        start:
          movements.length > 0
            ? formatDate(movements[movements.length - 1].createdAt)
            : "",
        end: movements.length > 0 ? formatDate(movements[0].createdAt) : "",
      },
    },
    batches: Object.values(batchSummary),
  };
};

// Helper function to generate Excel report
const generateExcelReport = (data, format) => {
  // TODO: Implement actual Excel generation
  // For now, return the same as CSV as placeholder
  return generateCSVReport(data, format);
};

// Helper function to generate CSV report
const generateCSVReport = (data, format) => {
  let csvContent = "";

  switch (format) {
    case "summary":
      // Generate summary CSV
      csvContent =
        "Product ID,Product Name,Total Inflow,Total Outflow,Net Change,Movements\n";
      data.products.forEach((product) => {
        csvContent += `${product.productId},"${product.productName}",${product.totalInflow},${product.totalOutflow},${product.netChange},${product.movements}\n`;
      });
      break;

    case "batch":
      // Generate batch CSV
      csvContent =
        "Batch Number,First Movement,Last Movement,Total Quantity,Product Count\n";
      data.batches.forEach((batch) => {
        csvContent += `"${batch.batchNumber}",${formatDate(
          batch.firstMovement
        )},${formatDate(batch.lastMovement)},${batch.totalQuantity},${
          batch.products.length
        }\n`;
      });
      break;

    case "detailed":
    default:
      // Generate detailed CSV
      csvContent =
        "ID,Tanggal,Produk,SKU,Tipe,Kuantitas,Stok Sebelum,Stok Sesudah,Alasan,Referensi,Batch,Kadaluarsa,Cabang,User\n";
      data.forEach((movement) => {
        const row = [
          movement.id,
          formatDate(movement.createdAt),
          `"${(movement.produk?.produkMaster?.namaProduk || "").replace(
            /"/g,
            '""'
          )}"`,
          movement.produk?.produkMaster?.sku || "",
          movement.type || "",
          movement.quantity,
          movement.stockBefore || "",
          movement.stockAfter || "",
          `"${(movement.reason || "").replace(/"/g, '""')}"`,
          `"${(movement.referenceId || "").replace(/"/g, '""')}"`,
          movement.batchNumber || "",
          movement.expiredDate ? formatDate(movement.expiredDate) : "",
          movement.cabang?.namaCabang || "",
          movement.user?.namaLengkap || "",
        ].join(",");
        csvContent += row + "\n";
      });
      break;
  }

  return csvContent;
};

// Helper function to generate PDF report
const generatePDFReport = (data, format) => {
  // TODO: Implement actual PDF generation with a library like pdfkit
  // For now, return a CSV as placeholder
  return generateCSVReport(data, format);
};

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Service untuk entry stok awal batch
const batchInitialStockEntry = async (data, auditInfo) => {
  const { cabangId, products, keterangan } = data;

  // Cek apakah cabang ada
  const cabang = await prisma.cabang.findUnique({
    where: {
      id: cabangId,
    },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Generate reference ID untuk batch entry (Batch-{timestamp})
  const referenceId = `BATCH-${Date.now()}`;

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    const movements = [];

    for (const product of products) {
      const { produkId, quantity, batchNumber, expiredDate } = product;

      // Cek apakah produk ada di cabang tersebut
      const produk = await prisma.produk.findFirst({
        where: {
          id: produkId,
          cabangId: cabangId,
        },
      });

      if (!produk) {
        throw new ResponseError(
          404,
          `Produk dengan ID ${produkId} tidak ditemukan di cabang ini`
        );
      }

      // Buat inventory movement
      const movement = await prisma.inventoryMovement.create({
        data: {
          produkId,
          cabangId,
          referenceId,
          referenceType: "adjustment", // Atau bisa juga membuat enum khusus "initial_entry"
          quantity,
          batchNumber,
          expiredDate,
          keterangan: keterangan || "Entry stok awal",
          userId: auditInfo.userId,
        },
      });

      // Update stok produk
      await prisma.produk.update({
        where: {
          id: produkId,
        },
        data: {
          stok: {
            increment: quantity,
          },
        },
      });

      movements.push(movement);
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "BATCH_INITIAL_STOCK_ENTRY",
        table_name: "inventory_movement",
        record_id: referenceId,
        new_values: JSON.stringify(movements),
      },
    });

    return { referenceId, movements };
  });

  return result;
};

// Service untuk stock opname
const stockOpname = async (data, auditInfo) => {
  const { cabangId, tanggalOpname, products, keteranganOpname } = data;

  // Cek apakah cabang ada
  const cabang = await prisma.cabang.findUnique({
    where: {
      id: cabangId,
    },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Generate reference ID untuk stock opname (OPNAME-{timestamp})
  const referenceId = `OPNAME-${Date.now()}`;

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    const movements = [];
    const updatedProducts = [];

    for (const product of products) {
      const {
        produkId,
        stokSistem,
        stokFisik,
        selisih,
        batchNumber,
        expiredDate,
        keterangan,
      } = product;

      // Cek apakah produk ada di cabang tersebut
      const produk = await prisma.produk.findFirst({
        where: {
          id: produkId,
          cabangId: cabangId,
        },
      });

      if (!produk) {
        throw new ResponseError(
          404,
          `Produk dengan ID ${produkId} tidak ditemukan di cabang ini`
        );
      }

      // Hanya buat inventory movement jika ada selisih
      if (selisih !== 0) {
        // Buat inventory movement
        const movement = await prisma.inventoryMovement.create({
          data: {
            produkId,
            cabangId,
            referenceId,
            referenceType: "adjustment",
            quantity: selisih, // Bisa positif atau negatif
            batchNumber,
            expiredDate,
            keterangan:
              keterangan || `Stock opname: ${stokSistem} → ${stokFisik}`,
            userId: auditInfo.userId,
          },
        });

        movements.push(movement);

        // Update stok produk ke stok fisik
        const updatedProduct = await prisma.produk.update({
          where: {
            id: produkId,
          },
          data: {
            stok: stokFisik,
          },
        });

        updatedProducts.push(updatedProduct);
      }
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        cabang_id: cabangId,
        action: "STOCK_OPNAME",
        table_name: "inventory_movement",
        record_id: referenceId,
        new_values: JSON.stringify(movements),
        old_values: JSON.stringify(
          products.map((p) => ({
            produkId: p.produkId,
            stokLama: p.stokSistem,
          }))
        ),
      },
    });

    return {
      referenceId,
      tanggalOpname,
      keteranganOpname,
      movements,
      updatedProducts,
      totalAdjusted: movements.length,
      totalProducts: products.length,
    };
  });

  return result;
};

// Service untuk update harga produk
const updateProductPrice = async (data, auditInfo) => {
  const {
    produkId,
    cabangId,
    tipeHarga,
    hargaBaru,
    alasanPerubahan,
    supplierId,
    dokumenReferensi,
  } = data;

  // Cek apakah produk ada di cabang tersebut
  const produk = await prisma.produk.findFirst({
    where: {
      id: produkId,
      cabangId: cabangId,
    },
  });

  if (!produk) {
    throw new ResponseError(404, "Produk tidak ditemukan di cabang ini");
  }

  // Dapatkan harga lama berdasarkan tipe harga
  let hargaLama;
  switch (tipeHarga) {
    case "beli":
      hargaLama = produk.hargaBeli;
      break;
    case "jual":
      hargaLama = produk.hargaJual;
      break;
    case "grosir":
      hargaLama = produk.hargaGrosir || 0;
      break;
  }

  // Update harga produk
  let updatedProduk;
  let priceHistory;

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  await prisma.$transaction(async (prisma) => {
    // Update produk berdasarkan tipe harga
    const updateData = {};
    switch (tipeHarga) {
      case "beli":
        updateData.hargaBeli = hargaBaru;
        break;
      case "jual":
        updateData.hargaJual = hargaBaru;
        break;
      case "grosir":
        updateData.hargaGrosir = hargaBaru;
        break;
    }

    updatedProduk = await prisma.produk.update({
      where: {
        id: produkId,
      },
      data: updateData,
      include: {
        produkMaster: true,
        cabang: true,
      },
    });

    // Catat riwayat perubahan harga
    priceHistory = await prisma.produkPriceHistory.create({
      data: {
        produkId,
        cabangId,
        tipeHarga,
        hargaLama,
        hargaBaru,
        tanggalPerubahan: new Date(),
        alasanPerubahan,
        supplierId,
        dokumenReferensi,
        created_by_user_Id: auditInfo.userId,
        created_by: auditInfo.userName,  
      },
      include: {
        produk: {
          include: {
            produkMaster: true,
          },
        },
        cabang: true,
        supplier: true,
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
    });

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        cabang_id: updatedProduk.cabangId,
        action: "UPDATE_PRODUCT_PRICE",
        table_name: "produk_price_history",
        record_id: priceHistory.id,
        old_values: JSON.stringify({ [tipeHarga]: hargaLama }),
        new_values: JSON.stringify({ [tipeHarga]: hargaBaru }),
      },
    });
  });

  // Invalidasi cache daftar produk
    await cacheDeletePattern("produk-list:*");

  return { updatedProduk, priceHistory };
};

// Mendapatkan riwayat perubahan harga dengan filter
const getPriceHistory = async (filters) => {
  const {
    produkId,
    cabangId,
    tipeHarga,
    startDate,
    endDate,
    supplierId,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {};

  if (produkId) where.produkId = produkId;
  if (cabangId) where.cabangId = cabangId;
  if (tipeHarga) where.tipeHarga = tipeHarga;
  if (supplierId) where.supplierId = supplierId;

  if (startDate || endDate) {
    where.tanggalPerubahan = {};
    if (startDate) where.tanggalPerubahan.gte = new Date(startDate);
    if (endDate) where.tanggalPerubahan.lte = new Date(endDate);
  }

  // Query untuk mendapatkan total count
  const totalCount = await prisma.produkPriceHistory.count({ where });

  // Query untuk mendapatkan data dengan pagination
  const priceHistory = await prisma.produkPriceHistory.findMany({
    where,
    include: {
      produk: {
        include: {
          produkMaster: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      supplier: {
        select: {
          id: true,
          namaSupplier: true,
        },
      },
    },
    orderBy: {
      tanggalPerubahan: "desc",
    },
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: priceHistory,
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

// Mendapatkan laporan status stok saat ini
const getCurrentStockReport = async (filters) => {
  const {
    cabangId,
    kategoriId,
    search,
    lowStock,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {
    cabangId,
  };

  if (kategoriId) {
    where.produkMaster = {
      kategoriId,
    };
  }

  if (search) {
    where.produkMaster = {
      ...(where.produkMaster || {}),
      OR: [
        { namaProduk: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  if (lowStock === "true") {
    where.OR = [
      { stok: { lte: prisma.produk.fields.minStok } },
      {
        AND: [
          { minStok: { not: null } },
          { stok: { lt: { mul: [prisma.produk.fields.minStok, 1.1] } } }, // Stok < 110% dari min stok
        ],
      },
    ];
  }

  // Query untuk mendapatkan total count
  const totalCount = await prisma.produk.count({
    where,
  });

  // Query untuk mendapatkan data dengan pagination
  const products = await prisma.produk.findMany({
    where,
    include: {
      produkMaster: {
        include: {
          kategori: true,
        },
      },
      cabang: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
    },
    orderBy: [
      { stok: "asc" },
      // Fix: Use proper nested ordering syntax for Prisma
      { produkMaster: { namaProduk: "asc" } },
    ],
    skip,
    take: limit,
  });

  // Hitung nilai inventaris
  const inventoryValue = products.reduce((total, product) => {
    return total + product.hargaBeli * (product.stok || 0);
  }, 0);

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: products,
    summary: {
      totalItems: totalCount,
      inventoryValue,
      lowStockCount: products.filter((p) => p.stok <= (p.minStok || 0)).length,
    },
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

// Get stock movement data with various filters
const getStockMovementData = async (filters = {}) => {
  const {
    cabangId,
    produkId,
    kategoriId,
    namaProduk,
    tipePergerakan,
    startDate,
    endDate,
    interval = 'day',
  } = filters;

  // Execute the database function with type casting to handle BigInt
  const result = await prisma.$queryRaw`
    SELECT 
      periode,
      cabang_id,
      nama_cabang,
      produk_id,
      nama_produk,
      sku,
      stok_masuk,
      stok_keluar,
      perubahan_bersih,
      jumlah_transaksi
    FROM get_pergerakan_stok(
      ${cabangId || null},
      ${produkId || null},
      ${kategoriId || null},
      ${namaProduk || null},
      ${tipePergerakan || null},
      ${startDate ? new Date(startDate) : null},
      ${endDate ? new Date(endDate) : null},
      ${interval}
    )
  `;


  return result;
};


module.exports = {
  createStockAdjustment,
  getInventoryMovements,
  exportInventoryMovements,
  getStockMovementData,
  generateMovementReport,
  batchInitialStockEntry,
  stockOpname,
  updateProductPrice,
  getPriceHistory,
  getCurrentStockReport,
};
