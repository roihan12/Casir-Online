const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { createAuditLog } = require("../utils/auditLog");
const {
  parseImportFile,
  validateRequiredColumns,
  parseBoolean,
} = require("../utils/excelParser");
const {
  validateProdukRow,
  PRODUK_REQUIRED_COLUMNS,
} = require("../validation/importProdukValidation");
const { cacheDeletePattern } = require("../utils/redisUtils");
const ExcelJS = require("exceljs");

const BATCH_SIZE = 100;

/**
 * Parse num helper
 */
const toNum = (val, fallback = 0) => {
  if (!val || String(val).trim() === "") return fallback;
  const n = Number(String(val).replace(/[,]/g, ""));
  return isNaN(n) ? fallback : n;
};

/**
 * Preview import Produk (dry-run) untuk satu cabang
 */
const previewImportProduk = async (buffer, mimetype, cabangId) => {
  const { headers, rows } = await parseImportFile(buffer, mimetype);

  validateRequiredColumns(headers, PRODUK_REQUIRED_COLUMNS);

  // Verify cabang exists
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
    select: { id: true, namaCabang: true },
  });
  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  const skusInFile = rows.map((r) => String(r.sku || "").trim()).filter(Boolean);

  // Fetch ProdukMaster yang ada by SKU
  const existingMasters = await prisma.produkMaster.findMany({
    where: { sku: { in: skusInFile }, deletedAt: null },
    select: { id: true, sku: true, namaProduk: true },
  });
  const masterMap = new Map(existingMasters.map((m) => [m.sku, m]));

  // Fetch produk yang sudah ada di cabang ini by produkMasterId
  const masterIds = existingMasters.map((m) => m.id);
  const existingProduk = await prisma.produk.findMany({
    where: { produkMasterId: { in: masterIds }, cabangId },
    select: { produkMasterId: true },
  });
  const existingProdukSet = new Set(existingProduk.map((p) => p.produkMasterId));

  const skuSet = new Set();
  const validRows = [];
  const errorRows = [];

  for (const row of rows) {
    const rowNumber = row._rowNumber;
    const sku = String(row.sku || "").trim();
    const validation = validateProdukRow(row, rowNumber);

    // Duplicate within file
    if (sku && skuSet.has(sku)) {
      validation.valid = false;
      validation.errors.push(`Baris ${rowNumber}: SKU '${sku}' duplikat dalam file`);
    } else if (sku) {
      skuSet.add(sku);
    }

    const master = masterMap.get(sku);
    let action = "insert";
    let actionNote = "";

    if (!master) {
      if (validation.valid) {
        validation.valid = false;
        validation.errors.push(
          `Baris ${rowNumber}: SKU '${sku}' tidak ditemukan di Produk Master`
        );
      }
      action = "error";
    } else if (existingProdukSet.has(master.id)) {
      action = "skip";
      actionNote = "Produk sudah ada di cabang ini";
    }

    const previewRow = {
      rowNumber,
      sku,
      namaProduk: master?.namaProduk || "-",
      hargaBeli: row.hargaBeli,
      hargaJual: row.hargaJual,
      hargaGrosir: row.hargaGrosir || "",
      stok: row.stok || "0",
      status: row.status || "tersedia",
      action,
      actionNote,
      valid: validation.valid,
      errors: validation.errors,
    };

    if (!validation.valid || action === "error") {
      errorRows.push(previewRow);
    } else {
      validRows.push(previewRow);
    }
  }

  return {
    cabang: { id: cabangId, namaCabang: cabang.namaCabang },
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
 * Import Produk dari file ke cabang tertentu
 * Mode: skip — jika SKU+cabang sudah ada, lewati
 */
const importProduk = async (buffer, mimetype, cabangId, { userId, userName, ipAddress }) => {
  const { rows } = await parseImportFile(buffer, mimetype);
  validateRequiredColumns(
    Object.keys(rows[0] || {}),
    PRODUK_REQUIRED_COLUMNS
  );

  // Verify cabang
  const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
  if (!cabang) throw new ResponseError(404, "Cabang tidak ditemukan");

  const skusInFile = rows.map((r) => String(r.sku || "").trim()).filter(Boolean);

  const [existingMasters, existingProduk] = await Promise.all([
    prisma.produkMaster.findMany({
      where: { sku: { in: skusInFile }, deletedAt: null },
      select: { id: true, sku: true },
    }),
    prisma.produk.findMany({
      where: {
        cabangId,
        produkMaster: { sku: { in: skusInFile } },
      },
      include: { produkMaster: { select: { sku: true } } },
    }),
  ]);

  const masterMap = new Map(existingMasters.map((m) => [m.sku, m.id]));
  const existingProdukSkuSet = new Set(
    existingProduk.map((p) => p.produkMaster.sku)
  );

  const result = {
    total: rows.length,
    berhasil: 0,
    dilewati: 0,
    gagal: 0,
    errors: [],
    skipped: [],
  };

  const skuSet = new Set();

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const toInsert = [];

    for (const row of batch) {
      const rowNumber = row._rowNumber;
      const sku = String(row.sku || "").trim();

      // Duplicate within file
      if (skuSet.has(sku)) {
        result.dilewati++;
        result.skipped.push({ row: rowNumber, sku, reason: "SKU duplikat dalam file" });
        continue;
      }
      skuSet.add(sku);

      // ProdukMaster must exist
      const produkMasterId = masterMap.get(sku);
      if (!produkMasterId) {
        result.gagal++;
        result.errors.push({
          row: rowNumber,
          field: "sku",
          message: `Baris ${rowNumber}: SKU '${sku}' tidak ditemukan di Produk Master`,
        });
        continue;
      }

      // Skip if already exists in this cabang
      if (existingProdukSkuSet.has(sku)) {
        result.dilewati++;
        result.skipped.push({ row: rowNumber, sku, reason: "Produk sudah ada di cabang ini, dilewati" });
        continue;
      }

      // Validate row data
      const validation = validateProdukRow(row, rowNumber);
      if (!validation.valid) {
        result.gagal++;
        validation.errors.forEach((e) => {
          result.errors.push({ row: rowNumber, message: e });
        });
        continue;
      }

      const hargaBeli = toNum(row.hargaBeli);
      const hargaJual = toNum(row.hargaJual);
      const hargaGrosir = row.hargaGrosir ? toNum(row.hargaGrosir) : null;
      const stok = row.stok ? parseInt(row.stok) : 0;
      const status = ["tersedia", "habis", "nonaktif"].includes(
        String(row.status || "").toLowerCase()
      )
        ? String(row.status).toLowerCase()
        : "tersedia";

      toInsert.push({
        rowNumber,
        sku,
        produkMasterId,
        hargaBeli,
        hargaJual,
        hargaGrosir,
        stok,
        minStok: row.minStok ? toNum(row.minStok) : null,
        maxStok: row.maxStok ? toNum(row.maxStok) : null,
        status,
      });
    }

    if (toInsert.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          for (const item of toInsert) {
            const created = await tx.produk.create({
              data: {
                produkMasterId: item.produkMasterId,
                cabangId,
                hargaBeli: item.hargaBeli,
                hargaJual: item.hargaJual,
                hargaGrosir: item.hargaGrosir,
                stok: item.stok,
                minStok: item.minStok,
                maxStok: item.maxStok,
                status: item.status,
                created_by: userName,
                updated_by: userName,
                created_by_user_Id: userId,
                updated_by_user_Id: userId,
              },
            });

            // Create initial price history
            const priceHistoryBase = {
              produkId: created.id,
              cabangId,
              hargaLama: 0,
              tanggalPerubahan: new Date(),
              alasanPerubahan: "Import dari file Excel/CSV",
              created_by: userName,
              updated_by: userName,
              created_by_user_Id: userId,
              updated_by_user_Id: userId,
            };

            await tx.produkPriceHistory.createMany({
              data: [
                { ...priceHistoryBase, tipeHarga: "beli", hargaBaru: item.hargaBeli },
                { ...priceHistoryBase, tipeHarga: "jual", hargaBaru: item.hargaJual },
                ...(item.hargaGrosir
                  ? [{ ...priceHistoryBase, tipeHarga: "grosir", hargaBaru: item.hargaGrosir }]
                  : []),
              ],
            });

            await createAuditLog(tx, {
              userId,
              userName,
              ipAddress,
              cabangId,
              action: "CREATE",
              tableName: "produk",
              recordId: created.id,
              oldValues: null,
              newValues: { ...item, importedFromFile: true },
            });
          }
        });
        result.berhasil += toInsert.length;
      } catch (error) {
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
    cacheDeletePattern("produk-list:*"),
    cacheDeletePattern(`low-stock-products:${cabangId}:*`),
  ]);

  return result;
};

/**
 * Generate template Excel untuk import Produk
 */
const generateProdukTemplate = async (cabangId = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Casir Online";
  workbook.created = new Date();

  // Sheet Data
  const dataSheet = workbook.addWorksheet("Produk", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  dataSheet.columns = [
    { header: "sku *", key: "sku", width: 20 },
    { header: "hargaBeli *", key: "hargaBeli", width: 15 },
    { header: "hargaJual *", key: "hargaJual", width: 15 },
    { header: "hargaGrosir", key: "hargaGrosir", width: 15 },
    { header: "stok", key: "stok", width: 10 },
    { header: "minStok", key: "minStok", width: 12 },
    { header: "maxStok", key: "maxStok", width: 12 },
    { header: "status", key: "status", width: 14 },
  ];

  const headerRow = dataSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Sample data
  const sampleData = [
    { sku: "AQ-600", hargaBeli: 2500, hargaJual: 4000, hargaGrosir: 3500, stok: 100, minStok: 10, maxStok: 500, status: "tersedia" },
    { sku: "IDM-GRG", hargaBeli: 2000, hargaJual: 3500, hargaGrosir: "", stok: 50, minStok: 5, maxStok: 200, status: "tersedia" },
  ];

  sampleData.forEach((data, i) => {
    const row = dataSheet.addRow(data);
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: i % 2 === 0 ? "FFF5F3FF" : "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle" };
    });
  });

  // Sheet Panduan
  const guideSheet = workbook.addWorksheet("Panduan");
  guideSheet.columns = [
    { header: "Kolom", key: "kolom", width: 18 },
    { header: "Wajib", key: "wajib", width: 10 },
    { header: "Keterangan", key: "keterangan", width: 55 },
    { header: "Contoh", key: "contoh", width: 20 },
  ];

  const guideHeaderRow = guideSheet.getRow(1);
  guideHeaderRow.height = 28;
  guideHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideData = [
    { kolom: "sku", wajib: "Ya", keterangan: "SKU produk harus sudah terdaftar di Produk Master", contoh: "AQ-600" },
    { kolom: "hargaBeli", wajib: "Ya", keterangan: "Harga beli produk (angka positif)", contoh: "2500" },
    { kolom: "hargaJual", wajib: "Ya", keterangan: "Harga jual produk (angka positif)", contoh: "4000" },
    { kolom: "hargaGrosir", wajib: "Tidak", keterangan: "Harga grosir (opsional)", contoh: "3500" },
    { kolom: "stok", wajib: "Tidak", keterangan: "Jumlah stok awal (bilangan bulat). Default: 0", contoh: "100" },
    { kolom: "minStok", wajib: "Tidak", keterangan: "Batas minimum stok untuk notifikasi", contoh: "10" },
    { kolom: "maxStok", wajib: "Tidak", keterangan: "Batas maksimum stok", contoh: "500" },
    { kolom: "status", wajib: "Tidak", keterangan: "Status: tersedia, habis, atau nonaktif. Default: tersedia", contoh: "tersedia" },
  ];

  guideData.forEach((data, i) => {
    const row = guideSheet.addRow(data);
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: i % 2 === 0 ? "FFF5F3FF" : "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  previewImportProduk,
  importProduk,
  generateProdukTemplate,
};
