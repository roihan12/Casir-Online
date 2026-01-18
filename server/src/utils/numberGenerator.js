const prisma = require("../config/db");

/**
 * Generate a transaction number based on the transaction type
 *
 * Format: [Type Prefix]-[YYYYMMDD]-[Sequential Number]
 * Example: PJL-20240323-0001
 *
 * @param {string} jenisTransaksi - Type of transaction (PENJUALAN, PEMBELIAN, RETUR_PENJUALAN, RETUR_PEMBELIAN)
 * @returns {Promise<string>} Generated transaction number
 */
const generateTransaksiNumber = async (jenisTransaksi) => {
  // Get prefix based on transaction type
  let prefix;
  switch (jenisTransaksi) {
    case "PENJUALAN":
      prefix = "PJL";
      break;
    case "PEMBELIAN":
      prefix = "PBL";
      break;
    case "RETUR_PENJUALAN":
      prefix = "RPJ";
      break;
    case "RETUR_PEMBELIAN":
      prefix = "RPB";
      break;
    default:
      prefix = "TRX";
  }

  // Get current date in YYYYMMDD format
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  // Get the current highest sequential number for today
  const latestTransaction = await prisma.transaksi.findFirst({
    where: {
      nomor_transaksi: {
        startsWith: `${prefix}-${dateStr}`,
      },
    },
    orderBy: {
      nomor_transaksi: "desc",
    },
  });

  // Extract the sequential number and increment it
  let sequentialNumber = 1;
  if (latestTransaction) {
    const parts = latestTransaction.nomor_transaksi.split("-");
    if (parts.length === 3) {
      sequentialNumber = parseInt(parts[2]) + 1;
    }
  }

  // Format the sequential number as a 4-digit number
  const sequentialStr = sequentialNumber.toString().padStart(4, "0");

  // Combine all parts to create the transaction number
  return `${prefix}-${dateStr}-${sequentialStr}`;
};

/**
 * Generate a new invoice number
 *
 * Format: INV-[YYYYMMDD]-[Sequential Number]
 * Example: INV-20240323-0001
 *
 * @returns {Promise<string>} Generated invoice number
 */
const generateInvoiceNumber = async () => {
  const prefix = "INV";

  // Get current date in YYYYMMDD format
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  // Get the current highest sequential number for today
  const latestInvoice = await prisma.faktur.findFirst({
    where: {
      nomor_faktur: {
        startsWith: `${prefix}-${dateStr}`,
      },
    },
    orderBy: {
      nomor_faktur: "desc",
    },
  });

  // Extract the sequential number and increment it
  let sequentialNumber = 1;
  if (latestInvoice) {
    const parts = latestInvoice.nomor_faktur.split("-");
    if (parts.length === 3) {
      sequentialNumber = parseInt(parts[2]) + 1;
    }
  }

  // Format the sequential number as a 4-digit number
  const sequentialStr = sequentialNumber.toString().padStart(4, "0");

  // Combine all parts to create the invoice number
  return `${prefix}-${dateStr}-${sequentialStr}`;
};

/**
 * Generate a product code for a new product
 *
 * Format: [Category Code]-[Sequential Number]
 * Example: GRO-0001
 *
 * @param {string} categoryCode - Code of the product category
 * @returns {Promise<string>} Generated product code
 */
const generateProductCode = async (categoryCode) => {
  // Get the current highest sequential number for this category
  const latestProduct = await prisma.produkMaster.findFirst({
    where: {
      kode: {
        startsWith: `${categoryCode}-`,
      },
    },
    orderBy: {
      kode: "desc",
    },
  });

  // Extract the sequential number and increment it
  let sequentialNumber = 1;
  if (latestProduct) {
    const parts = latestProduct.kode.split("-");
    if (parts.length === 2) {
      sequentialNumber = parseInt(parts[1]) + 1;
    }
  }

  // Format the sequential number as a 4-digit number
  const sequentialStr = sequentialNumber.toString().padStart(4, "0");

  // Combine to create the product code
  return `${categoryCode}-${sequentialStr}`;
};

module.exports = {
  generateTransaksiNumber,
  generateInvoiceNumber,
  generateProductCode,
};
