const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { createAuditLog } = require("../utils/auditLog");
const {
  parseImportFile,
  validateRequiredColumns,
  parseBoolean,
} = require("../utils/excelParser");
const {
  validateProdukMasterRow,
  PRODUK_MASTER_REQUIRED_COLUMNS,
} = require("../validation/importProdukMasterValidation");
const {
  cacheDeletePattern,
} = require("../utils/redisUtils");
const ProductDashboardService = require("./productDashboardService");
const ExcelJS = require("exceljs");
const { logger } = require("../utils/logger");


const BATCH_SIZE = 100;

/**
 * Parse dan validasi file import ProdukMaster tanpa menyimpan ke DB
 * @returns preview result
 */
const previewImportProdukMaster = async (buffer, mimetype) => {
  const { headers, rows } = await parseImportFile(buffer, mimetype);

  logger.info("headers", headers);
  logger.info("rows", rows);

  // Validate required columns
  validateRequiredColumns(headers, PRODUK_MASTER_REQUIRED_COLUMNS);

  // Validate each row and build preview
  const validRows = [];
  const errorRows = [];
  const skuSet = new Set(); // detect duplicate SKU within file

  // Fetch existing SKUs for conflict detection
  const skusInFile = rows.map((r) => String(r.sku || "").trim()).filter(Boolean);
  const existingMasters = await prisma.produkMaster.findMany({
    where: { sku: { in: skusInFile }, deletedAt: null },
    select: { sku: true },
  });
  const existingSkuSet = new Set(existingMasters.map((m) => m.sku));

  for (const row of rows) {
    const rowNumber = row._rowNumber;
    const sku = String(row.sku || "").trim();

    const validation = validateProdukMasterRow(row, rowNumber);

    // Duplicate within file
    if (sku && skuSet.has(sku)) {
      validation.valid = false;
      validation.errors.push(`Baris ${rowNumber}: SKU '${sku}' duplikat dalam file`);
    } else if (sku) {
      skuSet.add(sku);
    }

    const isExisting = existingSkuSet.has(sku);

    const previewRow = {
      rowNumber,
      sku,
      namaProduk: row.namaProduk,
      namaKategori: row.namaKategori,
      brand: row.brand || "",
      barcode: row.barcode || "",
      status: row.status || "aktif",
      action: isExisting ? "skip" : "insert",
      valid: validation.valid,
      errors: validation.errors,
    };

    if (!validation.valid) {
      errorRows.push(previewRow);
    } else {
      validRows.push(previewRow);
    }
  }

  return {
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: errorRows.length,
      willInsert: validRows.filter((r) => r.action === "insert").length,
      willSkip: validRows.filter((r) => r.action === "skip").length,
    },
    rows: [...validRows, ...errorRows].sort((a, b) => a.rowNumber - b.rowNumber),
  };
};

/**
 * Import ProdukMaster dari file Excel/CSV
 * Mode: skip — jika SKU sudah ada, lewati baris tersebut
 */
const importProdukMaster = async (buffer, mimetype, { userId, ipAddress }) => {
  const { headers, rows } = await parseImportFile(buffer, mimetype);

  validateRequiredColumns(headers, PRODUK_MASTER_REQUIRED_COLUMNS);

  // Prefetch semua kategori dan SKU yang ada
  const skusInFile = rows.map((r) => String(r.sku || "").trim()).filter(Boolean);

  const [existingMasters, allKategori] = await Promise.all([
    prisma.produkMaster.findMany({
      where: { sku: { in: skusInFile }, deletedAt: null },
      select: { sku: true },
    }),
    prisma.kategori.findMany({
      where: { deletedAt: null },
      select: { id: true, namaKategori: true },
    }),
  ]);

  const existingSkuSet = new Set(existingMasters.map((m) => m.sku));
  const kategoriMap = new Map(
    allKategori.map((k) => [k.namaKategori.toLowerCase(), k.id])
  );

  const result = {
    total: rows.length,
    berhasil: 0,
    dilewati: 0,
    gagal: 0,
    errors: [],
    skipped: [],
  };

  // Process in batches
  const skuSet = new Set(); // track within-file duplicates

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const toInsert = [];

    for (const row of batch) {
      const rowNumber = row._rowNumber;
      const sku = String(row.sku || "").trim();

      // Skip duplicate within file
      if (skuSet.has(sku)) {
        result.dilewati++;
        result.skipped.push({
          row: rowNumber,
          sku,
          reason: "SKU duplikat dalam file, baris pertama yang diproses",
        });
        continue;
      }
      skuSet.add(sku);

      // Skip if already exists (conflict = skip mode)
      if (existingSkuSet.has(sku)) {
        result.dilewati++;
        result.skipped.push({
          row: rowNumber,
          sku,
          reason: "SKU sudah terdaftar, dilewati",
        });
        continue;
      }

      // Validate row
      const validation = validateProdukMasterRow(row, rowNumber);
      if (!validation.valid) {
        result.gagal++;
        result.errors.push(...validation.errors.map((e) => ({ row: rowNumber, message: e })));
        continue;
      }

      // Lookup kategori
      const kategoriKey = String(row.namaKategori || "").toLowerCase().trim();
      const kategoriId = kategoriMap.get(kategoriKey);
      if (!kategoriId) {
        result.gagal++;
        result.errors.push({
          row: rowNumber,
          field: "namaKategori",
          message: `Baris ${rowNumber}: Kategori '${row.namaKategori}' tidak ditemukan`,
        });
        continue;
      }

      toInsert.push({
        rowNumber,
        sku,
        data: {
          namaProduk: String(row.namaProduk).trim(),
          sku,
          kategoriId,
          barcode: row.barcode ? String(row.barcode).trim() : null,
          brand: row.brand ? String(row.brand).trim() : null,
          deskripsi: row.deskripsi ? String(row.deskripsi).trim() : null,
          isManagedStock: row.isManagedStock
            ? parseBoolean(row.isManagedStock)
            : true,
          hasExpired: row.hasExpired ? parseBoolean(row.hasExpired) : false,
          status: ["aktif", "nonaktif"].includes(String(row.status || "").toLowerCase())
            ? String(row.status).toLowerCase()
            : "aktif",
        },
      });
    }

    // Bulk insert batch
    if (toInsert.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          for (const item of toInsert) {
            const created = await tx.produkMaster.create({
              data: item.data,
            });

            await createAuditLog(tx, {
              userId,
              ipAddress,
              action: "CREATE",
              tableName: "produk_master",
              recordId: created.id,
              oldValues: null,
              newValues: { ...item.data, importedFromFile: true },
            });
          }
        });
        result.berhasil += toInsert.length;
      } catch (error) {
        // If transaction fails, report all rows in batch as failed
        result.gagal += toInsert.length;
        toInsert.forEach((item) => {
          result.errors.push({
            row: item.rowNumber,
            message: `Baris ${item.rowNumber}: Gagal disimpan — ${error.message}`,
          });
        });
      }
    }
  }

  // Invalidate caches
  await Promise.all([
    cacheDeletePattern("produk-master-list:*"),
    cacheDeletePattern("produk-master:*"),
    cacheDeletePattern("produk-master-sku:*"),
    ProductDashboardService.invalidateProductDashboardCache(),
  ]);

  return result;
};

/**
 * Generate template Excel untuk ProdukMaster
 * @returns {Promise<Buffer>}
 */
const generateProdukMasterTemplate = async () => {
  // Ambil sample kategori untuk dropdown hint
  const kategoriList = await prisma.kategori.findMany({
    where: { deletedAt: null, status: "aktif" },
    select: { namaKategori: true },
    take: 20,
    orderBy: { namaKategori: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Casir Online";
  workbook.created = new Date();

  // ─── Sheet 1: Data ───────────────────────────────────────────────────────
  const dataSheet = workbook.addWorksheet("ProdukMaster", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  const columns = [
    { header: "namaProduk *", key: "namaProduk", width: 35 },
    { header: "sku *", key: "sku", width: 20 },
    { header: "namaKategori *", key: "namaKategori", width: 25 },
    { header: "barcode", key: "barcode", width: 20 },
    { header: "brand", key: "brand", width: 20 },
    { header: "deskripsi", key: "deskripsi", width: 40 },
    { header: "isManagedStock", key: "isManagedStock", width: 18 },
    { header: "hasExpired", key: "hasExpired", width: 14 },
    { header: "status", key: "status", width: 14 },
  ];

  dataSheet.columns = columns;

  // Style header row
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });

  // Sample data rows
  const sampleData = [
    {
      namaProduk: "Aqua Botol 600ml",
      sku: "AQ-600",
      namaKategori: kategoriList[0]?.namaKategori || "Minuman",
      barcode: "8999999000001",
      brand: "Aqua",
      deskripsi: "Air mineral 600ml",
      isManagedStock: "true",
      hasExpired: "true",
      status: "aktif",
    },
    {
      namaProduk: "Indomie Goreng",
      sku: "IDM-GRG",
      namaKategori: kategoriList[1]?.namaKategori || "Makanan",
      barcode: "8999999000002",
      brand: "Indofood",
      deskripsi: "Mie goreng instant",
      isManagedStock: "true",
      hasExpired: "true",
      status: "aktif",
    },
  ];

  sampleData.forEach((data, i) => {
    const row = dataSheet.addRow(data);
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: i % 2 === 0 ? "FFF9FAFB" : "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle" };
    });
  });

  // ─── Sheet 2: Panduan ────────────────────────────────────────────────────
  const guideSheet = workbook.addWorksheet("Panduan");
  guideSheet.columns = [
    { header: "Kolom", key: "kolom", width: 20 },
    { header: "Wajib", key: "wajib", width: 10 },
    { header: "Keterangan", key: "keterangan", width: 50 },
    { header: "Contoh", key: "contoh", width: 30 },
  ];

  const guideHeaderRow = guideSheet.getRow(1);
  guideHeaderRow.height = 28;
  guideHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideData = [
    { kolom: "namaProduk", wajib: "Ya", keterangan: "Nama produk, max 255 karakter", contoh: "Aqua Botol 600ml" },
    { kolom: "sku", wajib: "Ya", keterangan: "Kode unik produk, max 100 karakter. Digunakan sebagai identifier", contoh: "AQ-600" },
    { kolom: "namaKategori", wajib: "Ya", keterangan: "Nama kategori sesuai yang ada di sistem", contoh: kategoriList[0]?.namaKategori || "Minuman" },
    { kolom: "barcode", wajib: "Tidak", keterangan: "Barcode produk (opsional)", contoh: "8999999000001" },
    { kolom: "brand", wajib: "Tidak", keterangan: "Nama merek/brand produk", contoh: "Aqua" },
    { kolom: "deskripsi", wajib: "Tidak", keterangan: "Deskripsi produk", contoh: "Air mineral kemasan botol" },
    { kolom: "isManagedStock", wajib: "Tidak", keterangan: "Apakah stok dikelola? Isi: true atau false. Default: true", contoh: "true" },
    { kolom: "hasExpired", wajib: "Tidak", keterangan: "Apakah produk memiliki tanggal kadaluarsa? Isi: true atau false. Default: false", contoh: "false" },
    { kolom: "status", wajib: "Tidak", keterangan: "Status produk: aktif atau nonaktif. Default: aktif", contoh: "aktif" },
  ];

  guideData.forEach((data, i) => {
    const row = guideSheet.addRow(data);
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: i % 2 === 0 ? "FFF0FDF4" : "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  // ─── Sheet 3: Kategori yang tersedia ─────────────────────────────────────
  if (kategoriList.length > 0) {
    const kategoriSheet = workbook.addWorksheet("Daftar Kategori");
    kategoriSheet.columns = [{ header: "namaKategori", key: "nama", width: 30 }];

    const kHeaderRow = kategoriSheet.getRow(1);
    kHeaderRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF59E0B" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    kategoriList.forEach((k) => {
      kategoriSheet.addRow({ nama: k.namaKategori });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  previewImportProdukMaster,
  importProdukMaster,
  generateProdukMasterTemplate,
};
