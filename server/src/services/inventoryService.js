const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { cacheDeletePattern } = require("../utils/redisUtils");
const ExcelJS = require("exceljs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { logger } = require("../utils/logger");



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
const generateExcelReport = async (data, format) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Casir Online POS';
  workbook.created = new Date();

  // Helper for formatting currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (format === 'summary') {
    // Summary Report Sheet
    const summarySheet = workbook.addWorksheet('Summary', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Add header styling
    summarySheet.columns = [
      { header: 'Product ID', key: 'productId', width: 20 },
      { header: 'Product Name', key: 'productName', width: 40 },
      { header: 'Total Inflow', key: 'totalInflow', width: 15 },
      { header: 'Total Outflow', key: 'totalOutflow', width: 15 },
      { header: 'Net Change', key: 'netChange', width: 15 },
      { header: 'Movements', key: 'movements', width: 12 },
    ];

    // Style the header row
    summarySheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 25;

    // Add summary statistics at the top
    summarySheet.insertRow(1, ['SUMMARY STATISTICS']);
    summarySheet.mergeCells('A1:F1');
    summarySheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF4F46E5' } };
    summarySheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 30;

    summarySheet.insertRow(2, ['Total Products:', data.summary.totalProducts, '', '', '', '']);
    summarySheet.insertRow(3, ['Total Movements:', data.summary.totalMovements, '', '', '', '']);
    if (data.summary.dateRange) {
      summarySheet.insertRow(4, ['Date Range:', `${data.summary.dateRange.start} - ${data.summary.dateRange.end}`, '', '', '', '']);
    }

    // Add data rows
    data.products.forEach((product, index) => {
      const rowNumber = index + 6; // +6 for the summary rows and header
      summarySheet.addRow({
        productId: product.productId,
        productName: product.productName,
        totalInflow: product.totalInflow,
        totalOutflow: product.totalOutflow,
        netChange: product.netChange,
        movements: product.movements,
      });

      // Style net change column based on value
      const netChangeCell = summarySheet.getCell(`E${rowNumber}`);
      if (product.netChange < 0) {
        netChangeCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      } else {
        netChangeCell.font = { color: { argb: 'FF059669' }, bold: true };
      }
    });

    // Auto-fit columns
    summarySheet.columns.forEach(column => {
      if (column.key === 'productName') {
        column.width = 40;
      }
    });

  } else if (format === 'batch') {
    // Batch Report Sheet
    const batchSheet = workbook.addWorksheet('Batch Summary', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    batchSheet.columns = [
      { header: 'Batch Number', key: 'batchNumber', width: 25 },
      { header: 'Product Name', key: 'productName', width: 35 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'First Movement', key: 'firstMovement', width: 18 },
      { header: 'Last Movement', key: 'lastMovement', width: 18 },
    ];

    // Style the header row
    batchSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    batchSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    batchSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    batchSheet.getRow(1).height = 25;

    // Add summary at the top
    batchSheet.insertRow(1, ['BATCH SUMMARY REPORT']);
    batchSheet.mergeCells('A1:E1');
    batchSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF4F46E5' } };
    batchSheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    batchSheet.getRow(1).height = 30;

    batchSheet.insertRow(2, ['Total Batches:', data.summary.totalBatches, '', '', '']);
    batchSheet.insertRow(3, ['Total Movements:', data.summary.totalMovements, '', '', '']);

    let currentRow = 5;
    data.batches.forEach((batch) => {
      batch.products.forEach((product) => {
        batchSheet.addRow({
          batchNumber: batch.batchNumber,
          productName: product.productName,
          quantity: product.quantity,
          firstMovement: formatDate(batch.firstMovement),
          lastMovement: formatDate(batch.lastMovement),
        });

        // Style quantity based on value
        const qtyCell = batchSheet.getCell(`C${currentRow}`);
        if (product.quantity < 0) {
          qtyCell.font = { color: { argb: 'FFDC2626' }, bold: true };
        } else {
          qtyCell.font = { color: { argb: 'FF059669' }, bold: true };
        }

        currentRow++;
      });
    });

  } else {
    // Detailed Report Sheet
    const detailSheet = workbook.addWorksheet('Detailed Movements', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    detailSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Product', key: 'product', width: 35 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Reason', key: 'reason', width: 25 },
      { header: 'Reference', key: 'reference', width: 20 },
      { header: 'Batch', key: 'batch', width: 18 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'User', key: 'user', width: 20 },
    ];

    // Style the header row
    detailSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    detailSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    detailSheet.getRow(1).height = 25;

    // Add data rows
    data.forEach((movement) => {
      detailSheet.addRow({
        id: movement.id,
        date: formatDateTime(movement.createdAt),
        product: movement.produk?.produkMaster?.namaProduk || 'N/A',
        sku: movement.produk?.produkMaster?.sku || '',
        type: movement.referenceType || movement.type || '',
        quantity: movement.quantity,
        reason: movement.keterangan || movement.reason || '',
        reference: movement.referenceId || '',
        batch: movement.batchNumber || '',
        branch: movement.cabang?.namaCabang || '',
        user: movement.user?.namaLengkap || '',
      });

      // Style quantity column based on value
      const lastRow = detailSheet.lastRow.number;
      const qtyCell = detailSheet.getCell(`F${lastRow}`);
      if (movement.quantity < 0) {
        qtyCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      } else {
        qtyCell.font = { color: { argb: 'FF059669' }, bold: true };
      }
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
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
const generatePDFReport = async (data, format) => {
  // Determine template path
  const templatePath = path.join(__dirname, "../../templates/inventory_report_template.ejs");

  // Ensure template exists
  if (!fs.existsSync(templatePath)) {
    throw new ResponseError(500, "Template laporan tidak ditemukan");
  }

  // Prepare template data based on format
  let templateData = {
    language: 'id',
    reportTitle: 'Stock Movement Report',
    reportFormat: format,
    branchName: 'Casir Online',
  };

  // Calculate totals for detailed report
  if (format === 'detailed' && Array.isArray(data)) {
    const totalInflow = data.reduce((sum, m) => sum + (m.quantity > 0 ? m.quantity : 0), 0);
    const totalOutflow = data.reduce((sum, m) => sum + (m.quantity < 0 ? Math.abs(m.quantity) : 0), 0);
    templateData.movements = data;
    templateData.totalInflow = totalInflow;
    templateData.totalOutflow = totalOutflow;
  } else if (format === 'summary' && data.products) {
    templateData.summary = data.summary;
    templateData.products = data.products;
  } else if (format === 'batch' && data.batches) {
    templateData.summary = data.summary;
    templateData.batches = data.batches;
  }

  // Add helper functions to template data
  templateData.formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  templateData.formatQuantity = (qty) => {
    return new Intl.NumberFormat('id-ID').format(qty);
  };

  templateData.formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  templateData.formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Add filters
  templateData.filters = {
    branchName: 'All Branches',
    category: 'All Categories',
  };

  // Render template to HTML
  let html;
  try {
    html = await ejs.renderFile(templatePath, templateData);
  } catch (error) {
    logger.error("Error rendering template:", error);
    throw new ResponseError(500, `Error rendering template: ${error.message}`);
  }

  // Generate PDF from HTML
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      printBackground: true,
    });

    return pdfBuffer;
  } catch (error) {
    logger.error("Error generating PDF:", error);
    throw new ResponseError(500, `Error generating PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to format dates and times
const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
