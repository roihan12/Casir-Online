const ExportService = require("../services/exportService");
const FinancialReportService = require("../services/financialReportService");
const InventoryReportService = require("../services/inventoryReportService");
const { PrismaClient } = require("@prisma/client");
const { ResponseError } = require("../error/responseError");
const {
  exportSalesReportSchema,
  exportFinancialReportSchema,
  exportInventoryReportSchema,
  exportBranchReportSchema,
} = require("../validation/reportExportValidation");

const prisma = new PrismaClient();

/**
 * Get sales report data for export
 */
const getSalesReportData = async (filters) => {
  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate + "T23:59:59.999Z"),
    },
  };

  if (filters.cabangId && filters.cabangId !== "all") {
    whereClause.cabang_id = filters.cabangId;
  }

  const transactions = await prisma.transaksi.findMany({
    where: whereClause,
    include: {
      cabang: true,
      pelanggan: true,
    },
    orderBy: { tanggal: "desc" },
  });

  return transactions.map((t, index) => ({
    no: index + 1,
    tanggal: new Date(t.tanggal).toLocaleDateString("id-ID"),
    nomorTransaksi: t.nomor_transaksi,
    pelanggan: t.pelanggan?.namaPelanggan || "Umum",
    cabang: t.cabang?.namaCabang || "-",
    subtotal: Number(t.subtotal),
    diskon: Number(t.diskon),
    pajak: Number(t.pajak),
    total: Number(t.total),
    status: t.status_pembayaran,
  }));
};

/**
 * Get branch report data for export
 */
const getBranchReportData = async (filters) => {
  const whereClause = {
    deleted_at: null,
    jenis_transaksi: "PENJUALAN",
    tanggal: {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate + "T23:59:59.999Z"),
    },
  };

  const branches = await prisma.cabang.findMany({
    where: { status: "aktif", deletedAt: null },
  });

  const branchData = await Promise.all(
    branches.map(async (branch, index) => {
      const transactions = await prisma.transaksi.aggregate({
        where: {
          ...whereClause,
          cabang_id: branch.id,
        },
        _sum: { total: true },
        _count: { transaksi_id: true },
      });

      return {
        no: index + 1,
        cabang: branch.namaCabang,
        alamat: branch.alamat || "-",
        totalTransaksi: transactions._count.transaksi_id || 0,
        totalPenjualan: Number(transactions._sum.total || 0),
        rataRata:
          transactions._count.transaksi_id > 0
            ? Number(transactions._sum.total || 0) / transactions._count.transaksi_id
            : 0,
        kontribusi: 0, // Will be calculated after all data is fetched
      };
    })
  );

  // Calculate total and contribution percentage
  const grandTotal = branchData.reduce((sum, b) => sum + b.totalPenjualan, 0);
  branchData.forEach((branch) => {
    branch.kontribusi = grandTotal > 0 ? (branch.totalPenjualan / grandTotal) * 100 : 0;
  });

  return branchData;
};

/**
 * Get inventory report data for export
 */
const getInventoryReportData = async (filters) => {
  const whereClause = {
    deletedAt: null,
  };

  if (filters.cabangId && filters.cabangId !== "all") {
    whereClause.cabangId = filters.cabangId;
  }

  const products = await prisma.produk.findMany({
    where: whereClause,
    include: {
      produkMaster: {
        include: {
          kategori: true,
        },
      },
      cabang: true,
    },
    orderBy: {
      produkMaster: {
        namaProduk: "asc",
      },
    },
  });

  // Get inventory movements for the period
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      createdAt: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + "T23:59:59.999Z"),
      },
      ...(filters.cabangId && filters.cabangId !== "all" ? { cabangId: filters.cabangId } : {}),
    },
  });

  // Group movements by product
  const movementsByProduct = movements.reduce((acc, m) => {
    if (!acc[m.produkId]) {
      acc[m.produkId] = { masuk: 0, keluar: 0 };
    }
    if (m.quantity > 0) {
      acc[m.produkId].masuk += m.quantity;
    } else {
      acc[m.produkId].keluar += Math.abs(m.quantity);
    }
    return acc;
  }, {});

  return products.map((p, index) => {
    const movement = movementsByProduct[p.id] || { masuk: 0, keluar: 0 };
    const stokAkhir = p.stok || 0;
    const stokAwal = stokAkhir - movement.masuk + movement.keluar;

    return {
      no: index + 1,
      sku: p.produkMaster.sku,
      namaProduk: p.produkMaster.namaProduk,
      kategori: p.produkMaster.kategori?.namaKategori || "-",
      stokAwal: stokAwal,
      masuk: movement.masuk,
      keluar: movement.keluar,
      stokAkhir: stokAkhir,
      nilaiStok: Number(p.hargaBeli) * stokAkhir,
    };
  });
};

/**
 * Export sales report
 */
const exportSalesReport = async (req, res, next) => {
  try {
    const validatedData = exportSalesReportSchema.parse(req.query);
    const { format, startDate, endDate, cabangId } = validatedData;

    const data = await getSalesReportData({ startDate, endDate, cabangId });

    // Get cabang name for filter display
    let cabangName = "Semua Cabang";
    if (cabangId && cabangId !== "all") {
      const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
      cabangName = cabang?.namaCabang || cabangId;
    }

    const columns = ExportService.getColumnsForReportType("sales");
    const options = {
      title: "Laporan Penjualan",
      sheetName: "Laporan Penjualan",
      filters: {
        startDate,
        endDate,
        cabang: cabangName,
      },
    };

    let buffer;
    let contentType;
    let filename;

    switch (format) {
      case "excel":
        buffer = await ExportService.exportToExcel(data, columns, options);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `laporan_penjualan_${startDate}_${endDate}.xlsx`;
        break;
      case "pdf":
        buffer = await ExportService.exportToPdf(data, columns, options);
        contentType = "application/pdf";
        filename = `laporan_penjualan_${startDate}_${endDate}.pdf`;
        break;
      case "csv":
        buffer = ExportService.exportToCsv(data, columns);
        contentType = "text/csv";
        filename = `laporan_penjualan_${startDate}_${endDate}.csv`;
        break;
      default:
        throw new ResponseError(400, "Invalid export format");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export financial report
 */
const exportFinancialReport = async (req, res, next) => {
  try {
    const validatedData = exportFinancialReportSchema.parse(req.query);
    const { format, startDate, endDate, cabangId } = validatedData;

    // Get financial data using existing service
    const financialData = await FinancialReportService.getDetailedTransactions({
      startDate,
      endDate,
      cabangId: cabangId || "all",
      page: 1,
      limit: 10000, // Get all data for export
    });

    // Get cabang name for filter display
    let cabangName = "Semua Cabang";
    if (cabangId && cabangId !== "all") {
      const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
      cabangName = cabang?.namaCabang || cabangId;
    }

    // Transform data for export
    let runningBalance = 0;
    const data = (financialData.data || []).map((t, index) => {
      const isPemasukan = t.jenis_transaksi === "PENJUALAN";
      const amount = Number(t.total || 0);
      runningBalance += isPemasukan ? amount : -amount;

      return {
        no: index + 1,
        tanggal: new Date(t.tanggal).toLocaleDateString("id-ID"),
        jenis: t.jenis_transaksi,
        deskripsi: t.nomor_transaksi,
        pemasukan: isPemasukan ? amount : 0,
        pengeluaran: !isPemasukan ? amount : 0,
        saldo: runningBalance,
      };
    });

    const columns = ExportService.getColumnsForReportType("financial");
    const options = {
      title: "Laporan Keuangan",
      sheetName: "Laporan Keuangan",
      filters: {
        startDate,
        endDate,
        cabang: cabangName,
      },
    };

    let buffer;
    let contentType;
    let filename;

    switch (format) {
      case "excel":
        buffer = await ExportService.exportToExcel(data, columns, options);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `laporan_keuangan_${startDate}_${endDate}.xlsx`;
        break;
      case "pdf":
        buffer = await ExportService.exportToPdf(data, columns, options);
        contentType = "application/pdf";
        filename = `laporan_keuangan_${startDate}_${endDate}.pdf`;
        break;
      case "csv":
        buffer = ExportService.exportToCsv(data, columns);
        contentType = "text/csv";
        filename = `laporan_keuangan_${startDate}_${endDate}.csv`;
        break;
      default:
        throw new ResponseError(400, "Invalid export format");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export inventory report
 */
const exportInventoryReport = async (req, res, next) => {
  try {
    const validatedData = exportInventoryReportSchema.parse(req.query);
    const { format, startDate, endDate, cabangId } = validatedData;

    const data = await getInventoryReportData({ startDate, endDate, cabangId });

    // Get cabang name for filter display
    let cabangName = "Semua Cabang";
    if (cabangId && cabangId !== "all") {
      const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
      cabangName = cabang?.namaCabang || cabangId;
    }

    const columns = ExportService.getColumnsForReportType("inventory");
    const options = {
      title: "Laporan Inventori",
      sheetName: "Laporan Inventori",
      filters: {
        startDate,
        endDate,
        cabang: cabangName,
      },
    };

    let buffer;
    let contentType;
    let filename;

    switch (format) {
      case "excel":
        buffer = await ExportService.exportToExcel(data, columns, options);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `laporan_inventori_${startDate}_${endDate}.xlsx`;
        break;
      case "pdf":
        buffer = await ExportService.exportToPdf(data, columns, options);
        contentType = "application/pdf";
        filename = `laporan_inventori_${startDate}_${endDate}.pdf`;
        break;
      case "csv":
        buffer = ExportService.exportToCsv(data, columns);
        contentType = "text/csv";
        filename = `laporan_inventori_${startDate}_${endDate}.csv`;
        break;
      default:
        throw new ResponseError(400, "Invalid export format");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export branch report
 */
const exportBranchReport = async (req, res, next) => {
  try {
    const validatedData = exportBranchReportSchema.parse(req.query);
    const { format, startDate, endDate } = validatedData;

    const data = await getBranchReportData({ startDate, endDate });

    const columns = ExportService.getColumnsForReportType("branch");
    const options = {
      title: "Laporan Perbandingan Cabang",
      sheetName: "Laporan Cabang",
      filters: {
        startDate,
        endDate,
      },
    };

    let buffer;
    let contentType;
    let filename;

    switch (format) {
      case "excel":
        buffer = await ExportService.exportToExcel(data, columns, options);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `laporan_cabang_${startDate}_${endDate}.xlsx`;
        break;
      case "pdf":
        buffer = await ExportService.exportToPdf(data, columns, options);
        contentType = "application/pdf";
        filename = `laporan_cabang_${startDate}_${endDate}.pdf`;
        break;
      case "csv":
        buffer = ExportService.exportToCsv(data, columns);
        contentType = "text/csv";
        filename = `laporan_cabang_${startDate}_${endDate}.csv`;
        break;
      default:
        throw new ResponseError(400, "Invalid export format");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportSalesReport,
  exportFinancialReport,
  exportInventoryReport,
  exportBranchReport,
};
