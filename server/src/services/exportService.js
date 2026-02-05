const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

/**
 * Service for exporting report data to various formats
 */
class ExportService {
  /**
   * Export data to Excel format
   * @param {Array} data - Array of data objects
   * @param {Array} columns - Column definitions [{header: string, key: string, width: number}]
   * @param {Object} options - Export options
   * @param {string} options.title - Report title
   * @param {string} options.sheetName - Excel sheet name
   * @param {Object} options.filters - Applied filters info
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportToExcel(data, columns, options = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Casir-Online";
    workbook.created = new Date();

    const sheetName = options.sheetName || "Report";
    const worksheet = workbook.addWorksheet(sheetName);

    // Add title row if provided
    if (options.title) {
      worksheet.mergeCells(1, 1, 1, columns.length);
      const titleCell = worksheet.getCell("A1");
      titleCell.value = options.title;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: "center" };

      // Add filter info
      if (options.filters) {
        let filterRow = 2;
        if (options.filters.startDate && options.filters.endDate) {
          worksheet.mergeCells(filterRow, 1, filterRow, columns.length);
          worksheet.getCell(`A${filterRow}`).value = `Periode: ${options.filters.startDate} - ${options.filters.endDate}`;
          worksheet.getCell(`A${filterRow}`).alignment = { horizontal: "center" };
          filterRow++;
        }
        if (options.filters.cabang) {
          worksheet.mergeCells(filterRow, 1, filterRow, columns.length);
          worksheet.getCell(`A${filterRow}`).value = `Cabang: ${options.filters.cabang}`;
          worksheet.getCell(`A${filterRow}`).alignment = { horizontal: "center" };
          filterRow++;
        }
        // Add empty row after filters
        worksheet.addRow([]);
      }
    }

    // Set column definitions
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Style header row
    const headerRowNumber = options.title ? (options.filters ? 5 : 3) : 1;
    worksheet.getRow(headerRowNumber).values = columns.map((col) => col.header);
    worksheet.getRow(headerRowNumber).font = { bold: true };
    worksheet.getRow(headerRowNumber).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    worksheet.getRow(headerRowNumber).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(headerRowNumber).alignment = { horizontal: "center", vertical: "middle" };

    // Add data rows
    data.forEach((item, index) => {
      const rowData = columns.map((col) => {
        const value = item[col.key];
        // Format numbers with thousand separator
        if (col.format === "currency" && typeof value === "number") {
          return value;
        }
        return value;
      });
      const row = worksheet.addRow(rowData);

      // Zebra striping
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
      }

      // Format currency columns
      columns.forEach((col, colIndex) => {
        if (col.format === "currency") {
          row.getCell(colIndex + 1).numFmt = '#,##0';
        }
        if (col.format === "percentage") {
          row.getCell(colIndex + 1).numFmt = '0.00%';
        }
      });
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Array of data objects
   * @param {Array} columns - Column definitions [{header: string, key: string}]
   * @returns {string} CSV string
   */
  static exportToCsv(data, columns) {
    const headers = columns.map((col) => `"${col.header}"`).join(",");
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];
          if (value === null || value === undefined) {
            return '""';
          }
          // Escape quotes and wrap in quotes
          if (typeof value === "string") {
            value = value.replace(/"/g, '""');
            return `"${value}"`;
          }
          return `"${value}"`;
        })
        .join(",");
    });

    return [headers, ...rows].join("\n");
  }

  /**
   * Export data to PDF format
   * @param {Array} data - Array of data objects
   * @param {Array} columns - Column definitions [{header: string, key: string, width: number}]
   * @param {Object} options - Export options
   * @param {string} options.title - Report title
   * @param {Object} options.filters - Applied filters info
   * @returns {Promise<Buffer>} PDF file buffer
   */
  static async exportToPdf(data, columns, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: "A4",
          layout: columns.length > 5 ? "landscape" : "portrait",
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Title
        if (options.title) {
          doc.fontSize(18).font("Helvetica-Bold").text(options.title, { align: "center" });
          doc.moveDown(0.5);
        }

        // Filter info
        if (options.filters) {
          doc.fontSize(10).font("Helvetica");
          if (options.filters.startDate && options.filters.endDate) {
            doc.text(`Periode: ${options.filters.startDate} - ${options.filters.endDate}`, { align: "center" });
          }
          if (options.filters.cabang) {
            doc.text(`Cabang: ${options.filters.cabang}`, { align: "center" });
          }
          doc.moveDown();
        }

        // Generated date
        doc.fontSize(8).text(`Digenerate: ${new Date().toLocaleString("id-ID")}`, { align: "right" });
        doc.moveDown();

        // Table
        const tableTop = doc.y;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);
        const scaleFactor = pageWidth / totalDefinedWidth;

        let currentX = doc.page.margins.left;

        // Draw header
        doc.font("Helvetica-Bold").fontSize(9);
        doc.fillColor("#4F46E5");
        doc.rect(doc.page.margins.left, tableTop, pageWidth, 20).fill();
        doc.fillColor("#FFFFFF");

        columns.forEach((col) => {
          const colWidth = (col.width || 100) * scaleFactor;
          doc.text(col.header, currentX + 2, tableTop + 5, {
            width: colWidth - 4,
            align: "center",
          });
          currentX += colWidth;
        });

        // Draw data rows
        doc.fillColor("#000000").font("Helvetica").fontSize(8);
        let rowTop = tableTop + 20;
        const rowHeight = 18;
        const maxRowsPerPage = Math.floor((doc.page.height - rowTop - doc.page.margins.bottom) / rowHeight);

        data.forEach((item, index) => {
          // Check if we need a new page
          if (index > 0 && index % maxRowsPerPage === 0) {
            doc.addPage();
            rowTop = doc.page.margins.top;

            // Redraw header on new page
            doc.font("Helvetica-Bold").fontSize(9);
            doc.fillColor("#4F46E5");
            doc.rect(doc.page.margins.left, rowTop, pageWidth, 20).fill();
            doc.fillColor("#FFFFFF");

            currentX = doc.page.margins.left;
            columns.forEach((col) => {
              const colWidth = (col.width || 100) * scaleFactor;
              doc.text(col.header, currentX + 2, rowTop + 5, {
                width: colWidth - 4,
                align: "center",
              });
              currentX += colWidth;
            });

            doc.fillColor("#000000").font("Helvetica").fontSize(8);
            rowTop += 20;
          }

          // Zebra striping
          if (index % 2 === 0) {
            doc.fillColor("#F3F4F6");
            doc.rect(doc.page.margins.left, rowTop, pageWidth, rowHeight).fill();
            doc.fillColor("#000000");
          }

          currentX = doc.page.margins.left;
          columns.forEach((col) => {
            const colWidth = (col.width || 100) * scaleFactor;
            let value = item[col.key];

            // Format value
            if (col.format === "currency" && typeof value === "number") {
              value = new Intl.NumberFormat("id-ID").format(value);
            }
            if (col.format === "percentage" && typeof value === "number") {
              value = `${value.toFixed(2)}%`;
            }

            doc.text(String(value || "-"), currentX + 2, rowTop + 4, {
              width: colWidth - 4,
              align: col.align || "left",
            });
            currentX += colWidth;
          });

          rowTop += rowHeight;
        });

        // Draw table borders
        doc.strokeColor("#E5E7EB").lineWidth(0.5);
        doc.rect(doc.page.margins.left, tableTop, pageWidth, 20 + data.slice(0, maxRowsPerPage).length * rowHeight).stroke();

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format column definitions for common report types
   */
  static getColumnsForReportType(reportType) {
    const columnDefinitions = {
      sales: [
        { header: "No", key: "no", width: 5, align: "center" },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "No. Transaksi", key: "nomorTransaksi", width: 20 },
        { header: "Pelanggan", key: "pelanggan", width: 20 },
        { header: "Cabang", key: "cabang", width: 15 },
        { header: "Subtotal", key: "subtotal", width: 15, format: "currency", align: "right" },
        { header: "Diskon", key: "diskon", width: 12, format: "currency", align: "right" },
        { header: "Pajak", key: "pajak", width: 12, format: "currency", align: "right" },
        { header: "Total", key: "total", width: 15, format: "currency", align: "right" },
        { header: "Status", key: "status", width: 12 },
      ],
      financial: [
        { header: "No", key: "no", width: 5, align: "center" },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Jenis", key: "jenis", width: 15 },
        { header: "Deskripsi", key: "deskripsi", width: 25 },
        { header: "Pemasukan", key: "pemasukan", width: 15, format: "currency", align: "right" },
        { header: "Pengeluaran", key: "pengeluaran", width: 15, format: "currency", align: "right" },
        { header: "Saldo", key: "saldo", width: 15, format: "currency", align: "right" },
      ],
      inventory: [
        { header: "No", key: "no", width: 5, align: "center" },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Nama Produk", key: "namaProduk", width: 25 },
        { header: "Kategori", key: "kategori", width: 15 },
        { header: "Stok Awal", key: "stokAwal", width: 10, align: "right" },
        { header: "Masuk", key: "masuk", width: 10, align: "right" },
        { header: "Keluar", key: "keluar", width: 10, align: "right" },
        { header: "Stok Akhir", key: "stokAkhir", width: 10, align: "right" },
        { header: "Nilai Stok", key: "nilaiStok", width: 15, format: "currency", align: "right" },
      ],
      branch: [
        { header: "No", key: "no", width: 5, align: "center" },
        { header: "Cabang", key: "cabang", width: 20 },
        { header: "Alamat", key: "alamat", width: 25 },
        { header: "Total Transaksi", key: "totalTransaksi", width: 15, align: "right" },
        { header: "Total Penjualan", key: "totalPenjualan", width: 18, format: "currency", align: "right" },
        { header: "Rata-rata", key: "rataRata", width: 15, format: "currency", align: "right" },
        { header: "Kontribusi", key: "kontribusi", width: 12, format: "percentage", align: "right" },
      ],
    };

    return columnDefinitions[reportType] || columnDefinitions.sales;
  }
}

module.exports = ExportService;
