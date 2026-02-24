const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { format } = require("date-fns");
const { id } = require("date-fns/locale");

class ExportStreamService {
  // ---------------------------------------------------------------------------
  // Excel
  // ---------------------------------------------------------------------------
  static async streamToExcel(dataIterator, columns, options, res) {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheetName = options.sheetName
      ? options.sheetName.substring(0, 31)
      : "Report";
    const worksheet = workbook.addWorksheet(sheetName);

    // Column definitions
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key:    col.key,
      width:  col.width || 15,
    }));

    // Header row styling  (set font only once — first assignment was being overwritten)
    const headerRow = worksheet.getRow(1);
    headerRow.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    // In streaming mode every row must be committed explicitly
    headerRow.commit();

    let index = 1;
    for await (const row of dataIterator) {
      const rowData = {};

      columns.forEach((col) => {
        let val = row[col.key];
        if (col.key === "no") {
          val = index;
        } else if (col.format === "currency" && val != null) {
          // Keep as number so ExcelJS can apply numFmt; guard against null/undefined only
          val = Number(val);
        } else if (col.format === "percentage" && val != null) {
          val = Number(val) / 100;
        } else if (val instanceof Date) {
          val = format(val, "dd/MM/yyyy HH:mm", { locale: id });
        }

        rowData[col.key] = val != null ? val : "-";
      });

      const newRow = worksheet.addRow(rowData);

      // Apply cell number formats
      columns.forEach((col, colIdx) => {
        const cell = newRow.getCell(colIdx + 1);
        if (col.format === "currency") {
          cell.numFmt = "#,##0.00";
        } else if (col.format === "percentage") {
          cell.numFmt = "0.00%";
        }
      });

      // FIXED: commit each row (not the whole worksheet) for proper streaming
      newRow.commit();
      index++;
    }

    // FIXED: removed worksheet.commit() from inside the loop — only call once at the end
    worksheet.commit();
    await workbook.commit();
  }

  // ---------------------------------------------------------------------------
  // CSV
  // ---------------------------------------------------------------------------
  static async streamToCsv(dataIterator, columns, res) {
    const headers = columns.map((col) => `"${col.header}"`).join(",");
    res.write(headers + "\n");

    let index = 1;
    for await (const row of dataIterator) {
      const rowString = columns
        .map((col) => {
          let val = row[col.key];
          if (col.key === "no") val = index;

          if (val == null) return '""';
          if (val instanceof Date)
            val = format(val, "dd/MM/yyyy HH:mm", { locale: id });

          if (typeof val === "string") {
            val = val.replace(/"/g, '""').replace(/\n/g, " ");
          }
          return `"${val}"`;
        })
        .join(",");

      const ok = res.write(rowString + "\n");
      if (!ok) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
      index++;
    }

    res.end();
  }

  // ---------------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------------
  static async streamToPdf(dataIterator, columns, options, res) {
    const doc = new PDFDocument({
      margin: 40,
      size:   "A4",
      layout: columns.length > 5 ? "landscape" : "portrait",
    });

    doc.pipe(res);

    // Title
    if (options.title) {
      doc.fontSize(16).font("Helvetica-Bold").text(options.title, { align: "center" });
      doc.moveDown(0.5);
    }

    // Filter info
    if (options.filters) {
      doc.fontSize(10).font("Helvetica");
      if (options.filters.startDate && options.filters.endDate) {
        doc.text(
          `Periode: ${options.filters.startDate} - ${options.filters.endDate}`,
          { align: "center" }
        );
      }
      if (options.filters.cabang) {
        doc.text(`Cabang: ${options.filters.cabang}`, { align: "center" });
      }
      doc.moveDown();
    }

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const totalDefinedWidth = columns.reduce(
      (sum, col) => sum + (col.width || 100),
      0
    );
    const scaleFactor = pageWidth / totalDefinedWidth;
    const rowHeight   = 18;

    // Helper: draw a table header row at a given Y position
    const drawTableHeader = (yPos) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#4F46E5");
      doc.rect(doc.page.margins.left, yPos, pageWidth, 20).fill();
      doc.fillColor("#FFFFFF");

      let x = doc.page.margins.left;
      columns.forEach((col) => {
        const colWidth = (col.width || 100) * scaleFactor;
        doc.text(col.header, x + 2, yPos + 5, {
          width: colWidth - 4,
          align: "center",
        });
        x += colWidth;
      });

      // Reset to default text style after header
      doc.fillColor("#000000").font("Helvetica").fontSize(8);
    };

    // Draw initial header
    let rowTop = doc.y;
    drawTableHeader(rowTop);
    rowTop += 20; // FIXED: advance past header height before first data row

    let index = 1;
    for await (const row of dataIterator) {
      // Page break check
      if (rowTop + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        rowTop = doc.page.margins.top;
        drawTableHeader(rowTop);
        rowTop += 20; // FIXED: advance past repeated header before drawing data
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc
          .fillColor("#F3F4F6")
          .rect(doc.page.margins.left, rowTop, pageWidth, rowHeight)
          .fill()
          .fillColor("#000000");
      }

      // FIXED: reset currentX at the start of every data row
      let currentX = doc.page.margins.left;

      columns.forEach((col) => {
        const colWidth = (col.width || 100) * scaleFactor;
        let val = row[col.key];

        if (col.key === "no") {
          val = index;
        } else if (col.format === "currency" && val != null) {
          val = new Intl.NumberFormat("id-ID").format(Number(val));
        } else if (col.format === "percentage" && val != null) {
          val = `${Number(val).toFixed(2)}%`;
        } else if (val instanceof Date) {
          val = format(val, "dd/MM/yyyy HH:mm", { locale: id });
        }

        doc.text(String(val ?? "-"), currentX + 2, rowTop + 4, {
          width: colWidth - 4,
          align: col.align || "left",
        });
        currentX += colWidth;
      });

      rowTop += rowHeight;
      index++;
    }

    doc.end();
  }
}

module.exports = ExportStreamService;