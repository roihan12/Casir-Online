const { ResponseError } = require("../error/responseError");

/**
 * Validate a single Produk import row
 * Returns { valid: boolean, errors: string[] }
 */
const validateProdukRow = (row, rowNumber) => {
  const errors = [];

  // sku — required (reference to ProdukMaster)
  if (!row.sku || String(row.sku).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'sku' wajib diisi`);
  }

  // hargaBeli — required, must be positive number
  if (!row.hargaBeli || String(row.hargaBeli).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'hargaBeli' wajib diisi`);
  } else {
    const val = Number(String(row.hargaBeli).replace(/[,]/g, ""));
    if (isNaN(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'hargaBeli' harus berupa angka positif`);
    }
  }

  // hargaJual — required, must be positive number
  if (!row.hargaJual || String(row.hargaJual).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'hargaJual' wajib diisi`);
  } else {
    const val = Number(String(row.hargaJual).replace(/[,]/g, ""));
    if (isNaN(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'hargaJual' harus berupa angka positif`);
    }
  }

  // hargaGrosir — optional, must be positive if provided
  if (row.hargaGrosir && String(row.hargaGrosir).trim() !== "") {
    const val = Number(String(row.hargaGrosir).replace(/[,]/g, ""));
    if (isNaN(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'hargaGrosir' harus berupa angka positif`);
    }
  }

  // stok — optional, must be integer if provided
  if (row.stok && String(row.stok).trim() !== "") {
    const val = Number(row.stok);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'stok' harus berupa bilangan bulat positif`);
    }
  }

  // minStok — optional
  if (row.minStok && String(row.minStok).trim() !== "") {
    const val = Number(row.minStok);
    if (isNaN(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'minStok' harus berupa angka positif`);
    }
  }

  // maxStok — optional
  if (row.maxStok && String(row.maxStok).trim() !== "") {
    const val = Number(row.maxStok);
    if (isNaN(val) || val < 0) {
      errors.push(`Baris ${rowNumber}: 'maxStok' harus berupa angka positif`);
    }
  }

  // status — optional, must be valid
  if (row.status && !["tersedia", "habis", "nonaktif"].includes(String(row.status).toLowerCase())) {
    errors.push(`Baris ${rowNumber}: 'status' harus 'tersedia', 'habis', atau 'nonaktif'`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Required columns for Produk import
 */
const PRODUK_REQUIRED_COLUMNS = ["sku", "hargaBeli", "hargaJual"];

module.exports = {
  validateProdukRow,
  PRODUK_REQUIRED_COLUMNS,
};
