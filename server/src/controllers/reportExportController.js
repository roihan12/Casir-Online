const ReportExportRawService = require("../services/reportExportRawService");
const ExportStreamService = require("../services/exportStreamService");
const { PrismaClient } = require("@prisma/client");
const { ResponseError } = require("../error/responseError");
const { exportBranchReportSchema } = require("../validation/reportExportValidation");

const prisma = new PrismaClient();

/**
 * Get Columns for each report
 */
const getColumnsForReportType = (reportType) => {
  const defs = {
    sales: [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "No. Transaksi", key: "nomorTransaksi", width: 22 },
      { header: "Pelanggan", key: "pelanggan", width: 20 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "Subtotal", key: "subtotal", width: 15, format: "currency" },
      { header: "Diskon", key: "diskon", width: 12, format: "currency" },
      { header: "Diskon Member", key: "diskonMember", width: 12, format: "currency" },
      { header: "Total Diskon Final", key: "totalDiskonFinal", width: 12, format: "currency" },
      { header: "Diskon Manual Persen", key: "diskonManualPersen", width: 12, format: "currency" },
      { header: "Diskon Manual Nominal", key: "diskonManualNominal", width: 12, format: "currency" },
      { header: "Diskon Manual Alasan", key: "diskonManualAlasan", width: 12 },
      { header: "Loyalty Discount", key: "loyaltyDiscount", width: 12, format: "currency" },
      { header: "Points Earned", key: "pointsEarned", width: 12 },
      { header: "Points Redeemed", key: "pointsRedeemed", width: 12 },
      { header: "Pajak", key: "pajak", width: 12, format: "currency" },
      { header: "Total", key: "total", width: 15, format: "currency" },
      { header: "Status", key: "status", width: 12 },
    ],
    inventory: [
      { header: "No", key: "no", width: 5 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Nama Produk", key: "namaProduk", width: 30 },
      { header: "Satuan", key: "satuan", width: 15 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Kategori", key: "kategori", width: 15 },
      { header: "Stok", key: "stokAkhir", width: 10 },
      { header: "Harga Beli", key: "hargaBeli", width: 15, format: "currency" },
      { header: "Harga Jual", key: "hargaJual", width: 15, format: "currency" },
      { header: "Harga Grosir", key: "hargaGrosir", width: 15, format: "currency" },
      { header: "Nilai Stok", key: "nilaiStok", width: 15, format: "currency" },
    ],
    health: [
      { header: "No", key: "no", width: 5 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Nama Produk", key: "namaProduk", width: 30 },
      { header: "Satuan", key: "satuan", width: 15 },
      { header: "Stok Saat Ini", key: "currentStock", width: 12 },
      { header: "Min Stok", key: "minStock", width: 10 },
      { header: "Max Stok", key: "maxStock", width: 10 },
      { header: "Status Kesehatan", key: "statusKesehatan", width: 15 },
    ],
    "profit-loss": [
      { header: "Cabang", key: "nama_cabang", width: 22, align: "left" },
      { header: "Keterangan", key: "keterangan", width: 32, align: "left" },
      { header: "Nilai (Rp)", key: "nilai", width: 20, align: "right", format: "currency" },
      { header: "Margin (%)", key: "pct", width: 14, align: "right", format: "percentage_raw" },
    ],
    shift: [
      { header: "No", key: "no", width: 5 },
      { header: "Kasir", key: "kasir", width: 20 },
      { header: "Cabang", key: "cabang", width: 18 },
      { header: "Waktu Mulai", key: "waktuMulai", width: 20 },
      { header: "Waktu Selesai", key: "waktuSelesai", width: 20 },
      { header: "Kas Awal", key: "kasAwal", width: 15, format: "currency" },
      { header: "Kas Akhir", key: "kasAkhir", width: 15, format: "currency" },
      { header: "Total Transaksi", key: "totalTransaksi", width: 15 },
      { header: "Total Pendapatan", key: "totalPendapatan", width: 18, format: "currency" },
      { header: "Selisih Kas", key: "selisihKas", width: 15, format: "currency" },
      { header: "Status", key: "status", width: 12 },
    ],
    financial: [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Jenis", key: "jenis", width: 15 },
      { header: "Deskripsi", key: "deskripsi", width: 25 },
      { header: "Pemasukan", key: "pemasukan", width: 15, format: "currency" },
      { header: "Pengeluaran", key: "pengeluaran", width: 15, format: "currency" },
    ],
    promo: [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Promo", key: "namaPromo", width: 25 },
      { header: "Kode Promo", key: "kodePromo", width: 15 },
      { header: "Tipe Diskon", key: "tipeDiskon", width: 15 },
      { header: "Nilai Diskon", key: "nilaiDiskon", width: 15, format: "currency" },
      { header: "Total Penggunaan", key: "totalPenggunaan", width: 18 },
      { header: "Total Penghematan Diskon", key: "totalDiskon", width: 22, format: "currency" },
    ],
    "low-stock": [
      { header: "No", key: "no", width: 5 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Nama Produk", key: "namaProduk", width: 30 },
      { header: "Kategori", key: "kategori", width: 15 },
      { header: "Batas Min Stok", key: "minStok", width: 15 },
      { header: "Stok Tersisa", key: "stokTersisa", width: 15 },
      { header: "Cabang", key: "cabang", width: 18 },
    ],
    loyalty: [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Pelanggan", key: "namaPelanggan", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Telepon", key: "telepon", width: 15 },
      { header: "Cabang", key: "namaCabang", width: 18 },
      { header: "Segmen", key: "segmen", width: 18 },
      { header: "Poin Sisa", key: "poinSisa", width: 10 },
      { header: "Total Transaksi", key: "totalTransaksi", width: 15 },
      { header: "Total Belanja", key: "totalBelanja", width: 18, format: "currency" },
    ],
    "transaction-detail": [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "No. Transaksi", key: "nomorTransaksi", width: 22 },
      { header: "Pelanggan", key: "pelanggan", width: 20 },
      { header: "Nama Produk", key: "namaProduk", width: 30 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Harga Satuan", key: "hargaSatuan", width: 15, format: "currency" },
      { header: "Diskon Line", key: "diskonLine", width: 12, format: "currency" },
      { header: "Total Line", key: "totalLine", width: 15, format: "currency" },
    ],
  };
  return defs[reportType] || defs.sales;
};

const reportTitles = {
  sales: "Laporan Penjualan",
  inventory: "Laporan Inventori",
  health: "Laporan Kesehatan Stok",
  "profit-loss": "Laporan Laba & Rugi",
  shift: "Laporan Performa Shift",
  financial: "Laporan Keuangan",
  promo: "Laporan Promo & Diskon",
  "low-stock": "Laporan Produk Menipis",
  loyalty: "Laporan Top Spender Customer",
  "transaction-detail": "Laporan Detail Transaksi"
};

/**
 * Universal Unified Streaming Export Controller
 */
const exportReportUnified = async (req, res, next) => {
  try {
    const reportType = req.params.reportType;
    if (!reportTitles[reportType] && reportType !== "branch") {
      throw new ResponseError(400, "Jenis laporan tidak didukung");
    }

    // Branch handled separately below (legacy map fallback if needed, but we keep it here just in case)
    if (reportType === "branch") {
      return next(); // pass to exportBranchReport
    }

    const { format = "excel", startDate, endDate, cabangId } = req.query;
    
    // Get Cabang Name
    let cabangName = "Semua Cabang";
    if (cabangId && cabangId !== "all") {
      const cbg = await prisma.cabang.findUnique({ where: { id: cabangId } });
      if (cbg) cabangName = cbg.namaCabang;
    }

    const options = {
      title: reportTitles[reportType],
      sheetName: reportTitles[reportType],
      filters: {
        startDate,
        endDate,
        cabang: cabangName
      }
    };
    
    // Map request to raw query stream
    const filters = { startDate, endDate, cabangId };
    let dataStream;
    
    switch (reportType) {
      case "sales": dataStream = ReportExportRawService.getSalesDataStream(filters); break;
      case "inventory": dataStream = ReportExportRawService.getInventoryDataStream(filters); break;
      case "health": dataStream = ReportExportRawService.getInventoryHealthDataStream(filters); break;
      case "profit-loss": dataStream = ReportExportRawService.getProfitLossDataStream(filters); break;
      case "shift": dataStream = ReportExportRawService.getShiftPerformanceDataStream(filters); break;
      case "financial": dataStream = ReportExportRawService.getFinancialDataStream(filters); break;
      case "promo": dataStream = ReportExportRawService.getPromoDiscountDataStream(filters); break;
      case "low-stock": dataStream = ReportExportRawService.getLowStockDataStream(filters); break;
      case "loyalty": dataStream = ReportExportRawService.getCustomerLoyaltyDataStream(filters); break;
      case "transaction-detail": dataStream = ReportExportRawService.getTransactionDetailDataStream(filters); break;
    }

    const columns = getColumnsForReportType(reportType);
    const dateStr = startDate && endDate ? `${startDate}_${endDate}` : `${new Date().toISOString().split('T')[0]}`;
    const filename = `${reportType}_${dateStr}.${format === "excel" ? "xlsx" : format}`;

    // Headers configuration for chunks
    if (format === "excel") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToExcel(dataStream, columns, options, res);
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToCsv(dataStream, columns, res);
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToPdf(dataStream, columns, options, res);
    } else {
      throw new ResponseError(400, "Format tidak valid");
    }

  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      console.error("Streaming export error:", err);
      res.end();
    }
  }
};

/**
 * Export branch report (Keeping it compatible with legacy implementation schema but returning JSON or stream)
 */
const exportBranchReport = async (req, res, next) => {
  try {
    const validatedData = exportBranchReportSchema.parse(req.query);
    const { format, startDate, endDate } = validatedData;
    const reportType = "branch";

    // Legacy manual logic for Branch since it aggregates differently
    const branches = await prisma.cabang.findMany({ where: { status: "aktif", deletedAt: null } });
    const whereClause = { deleted_at: null, jenis_transaksi: "PENJUALAN", tanggal: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59.999Z") } };
    
    // Process aggregations safely
    const branchData = await Promise.all(
      branches.map(async (branch, index) => {
        const tr = await prisma.transaksi.aggregate({ where: { ...whereClause, cabang_id: branch.id }, _sum: { total: true }, _count: { transaksi_id: true } });
        return {
          no: index + 1,
          cabang: branch.namaCabang,
          alamat: branch.alamat || "-",
          totalTransaksi: tr._count.transaksi_id || 0,
          totalPenjualan: Number(tr._sum.total || 0),
          rataRata: tr._count.transaksi_id > 0 ? Number(tr._sum.total || 0) / tr._count.transaksi_id : 0,
          kontribusi: 0
        };
      })
    );
    const grandTotal = branchData.reduce((sum, b) => sum + b.totalPenjualan, 0);
    branchData.forEach(b => b.kontribusi = grandTotal > 0 ? (b.totalPenjualan / grandTotal) * 100 : 0);

    const columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Cabang", key: "cabang", width: 20 },
        { header: "Alamat", key: "alamat", width: 25 },
        { header: "Total Transaksi", key: "totalTransaksi", width: 15 },
        { header: "Total Penjualan", key: "totalPenjualan", width: 18, format: "currency" },
        { header: "Rata-rata", key: "rataRata", width: 15, format: "currency" },
        { header: "Kontribusi", key: "kontribusi", width: 12, format: "percentage"},
    ];

    const options = {
        title: "Laporan Cabang",
        sheetName: "Cabang",
        filters: { startDate, endDate }
    };
    
    const dateStr = `${startDate}_${endDate}`;
    const filename = `${reportType}_${dateStr}.${format === "excel" ? "xlsx" : format}`;

    // Mock data stream for arrays
    async function* arrayToStream(arr) {
        for(let a of arr) yield a;
    }

    if (format === "excel") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToExcel(arrayToStream(branchData), columns, options, res);
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToCsv(arrayToStream(branchData), columns, res);
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await ExportStreamService.streamToPdf(arrayToStream(branchData), columns, options, res);
    }
  } catch (error) {
     if (!res.headersSent) next(error);
  }
};

module.exports = {
  exportReportUnified,
  exportBranchReport
};
