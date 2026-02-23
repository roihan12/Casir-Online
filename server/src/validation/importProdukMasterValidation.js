const { ResponseError } = require("../error/responseError");

/**
 * Validate a single ProdukMaster import row
 * Returns { valid: boolean, errors: string[] }
 */
const validateProdukMasterRow = (row, rowNumber) => {
  const errors = [];

  // namaProduk — required
  if (!row.namaProduk || String(row.namaProduk).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'namaProduk' wajib diisi`);
  } else if (String(row.namaProduk).length > 255) {
    errors.push(`Baris ${rowNumber}: 'namaProduk' maksimal 255 karakter`);
  }

  // sku — required
  if (!row.sku || String(row.sku).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'sku' wajib diisi`);
  } else if (String(row.sku).length > 100) {
    errors.push(`Baris ${rowNumber}: 'sku' maksimal 100 karakter`);
  }

  // namaKategori — required
  if (!row.namaKategori || String(row.namaKategori).trim() === "") {
    errors.push(`Baris ${rowNumber}: 'namaKategori' wajib diisi`);
  }

  // status — optional, must be valid
  if (row.status && !["aktif", "nonaktif"].includes(String(row.status).toLowerCase())) {
    errors.push(`Baris ${rowNumber}: 'status' harus 'aktif' atau 'nonaktif'`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Required columns for ProdukMaster import
 */
const PRODUK_MASTER_REQUIRED_COLUMNS = ["namaProduk", "sku", "namaKategori"];

module.exports = {
  validateProdukMasterRow,
  PRODUK_MASTER_REQUIRED_COLUMNS,
};
