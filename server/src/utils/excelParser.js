const ExcelJS = require("exceljs");
const { ResponseError } = require("../error/responseError");

const MAX_ROWS = 1000;

const SUPPORTED_EXCEL_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const SUPPORTED_CSV_TYPES = ["text/csv", "text/plain", "application/csv"];

/**
 * Parse Excel buffer (xlsx/xls) → array of row objects
 * @param {Buffer} buffer
 * @param {string} sheetName - optional, default first sheet
 * @returns {Promise<{ headers: string[], rows: Object[], totalRows: number }>}
 */
const parseExcelBuffer = async (buffer, sheetName = null) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  let worksheet;
  if (sheetName) {
    worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new ResponseError(
        400,
        `Sheet "${sheetName}" tidak ditemukan dalam file Excel`
      );
    }
  } else {
    worksheet = workbook.worksheets[0];
  }

  if (!worksheet) {
    throw new ResponseError(400, "File Excel tidak memiliki sheet yang valid");
  }

  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1); // exceljs row values index starts at 1

    if (rowNumber === 1) {
      // First row = headers
      headers = values.map((v) =>
        v !== null && v !== undefined ? String(v).trim() : ""
      );
      return;
    }

    // Skip completely empty rows
    const hasData = values.some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );
    if (!hasData) return;

    // Map values to header keys
    const rowObj = {};
    headers.forEach((header, index) => {
      if (!header) return;
      let cellValue = values[index];

      // Handle ExcelJS rich text / formula objects
      if (cellValue && typeof cellValue === "object") {
        if (cellValue.richText) {
          cellValue = cellValue.richText.map((r) => r.text).join("");
        } else if (cellValue.result !== undefined) {
          cellValue = cellValue.result;
        } else if (cellValue.text !== undefined) {
          cellValue = cellValue.text;
        }
      }

      rowObj[header] = cellValue !== undefined && cellValue !== null
        ? String(cellValue).trim()
        : "";
    });

    rows.push({ _rowNumber: rowNumber, ...rowObj });
  });

  if (rows.length > MAX_ROWS) {
    throw new ResponseError(
      400,
      `File melebihi batas maksimum ${MAX_ROWS} baris. File Anda memiliki ${rows.length} baris data.`
    );
  }

  return { headers, rows, totalRows: rows.length };
};

/**
 * Parse CSV buffer → array of row objects
 * @param {Buffer} buffer
 * @returns {Promise<{ headers: string[], rows: Object[], totalRows: number }>}
 */
const parseCsvBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.csv.read(
    require("stream").Readable.from(buffer)
  );

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ResponseError(400, "File CSV tidak valid atau kosong");
  }

  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1);

    if (rowNumber === 1) {
      headers = values.map((v) =>
        v !== null && v !== undefined ? String(v).trim() : ""
      );
      return;
    }

    const hasData = values.some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );
    if (!hasData) return;

    const rowObj = {};
    headers.forEach((header, index) => {
      if (!header) return;
      rowObj[header] =
        values[index] !== undefined && values[index] !== null
          ? String(values[index]).trim()
          : "";
    });

    rows.push({ _rowNumber: rowNumber, ...rowObj });
  });

  if (rows.length > MAX_ROWS) {
    throw new ResponseError(
      400,
      `File melebihi batas maksimum ${MAX_ROWS} baris. File Anda memiliki ${rows.length} baris data.`
    );
  }

  return { headers, rows, totalRows: rows.length };
};

/**
 * Auto-detect format and parse buffer
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} sheetName - optional (Excel only)
 * @returns {Promise<{ headers: string[], rows: Object[], totalRows: number }>}
 */
const parseImportFile = async (buffer, mimetype, sheetName = null) => {
  if (SUPPORTED_EXCEL_TYPES.includes(mimetype)) {
    return parseExcelBuffer(buffer, sheetName);
  }

  if (SUPPORTED_CSV_TYPES.includes(mimetype)) {
    return parseCsvBuffer(buffer);
  }

  throw new ResponseError(
    400,
    "Format file tidak didukung. Gunakan file Excel (.xlsx) atau CSV (.csv)"
  );
};

/**
 * Validate required columns are present in header
 * @param {string[]} headers - parsed headers from file
 * @param {string[]} required - required column names
 */
const validateRequiredColumns = (headers, required) => {
  const missing = required.filter(
    (col) => !headers.map((h) => h.toLowerCase()).includes(col.toLowerCase())
  );
  if (missing.length > 0) {
    throw new ResponseError(
      400,
      `Kolom wajib tidak ditemukan dalam file: ${missing.join(", ")}. Pastikan menggunakan template yang benar.`
    );
  }
};

/**
 * Convert string value to boolean
 * @param {string} value
 * @returns {boolean}
 */
const parseBoolean = (value) => {
  if (!value || value === "") return false;
  return ["true", "ya", "yes", "1", "aktif"].includes(
    String(value).toLowerCase()
  );
};

/**
 * Convert string to number safely
 * @param {string} value
 * @returns {number|null}
 */
const parseNumber = (value) => {
  if (!value || value === "") return null;
  const num = Number(String(value).replace(/[,.]/g, (m) => (m === "." ? "." : "")));
  return isNaN(num) ? null : num;
};

module.exports = {
  parseImportFile,
  parseExcelBuffer,
  parseCsvBuffer,
  validateRequiredColumns,
  parseBoolean,
  parseNumber,
  MAX_ROWS,
};
