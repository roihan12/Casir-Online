const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

/**
 * Get expiring products report
 * Queries the vw_produk_akan_kadaluarsa view
 * @param {Object} filters - Filter options
 * @param {number} filters.cabangId - Filter by branch ID (optional)
 * @param {number} filters.kategoriId - Filter by category ID (optional)
 * @param {number} filters.daysThreshold - Filter by days remaining threshold (default: 90)
 * @param {string} filters.statusKadaluarsa - Filter by expiration status (optional)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 * @returns {Object} Expiring products report data
 */
const getExpiringProductsReport = async (filters) => {
  const {
    cabangId,
    kategoriId,
    daysThreshold = 90,
    statusKadaluarsa,
    page = 1,
    limit = 10,
  } = filters;

  // Build the base query
  let query = `
    SELECT 
      pk.produk_id,
      pk.cabang_id,
      pk.nama_cabang,
      pk.nama_produk,
      pk.sku,
      pk.barcode,
      pk.stok,
      pk.tanggal_kadaluarsa,
      pk.harga_jual,
      pk.status,
      pk.tanggal_sekarang,
      pk.hari_tersisa,
      pk.status_kadaluarsa
    FROM vw_produk_akan_kadaluarsa pk
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Add filters
  if (cabangId) {
    query += ` AND pk.cabang_id = $${paramIndex}`;
    params.push(cabangId);
    paramIndex++;
  }

  if (kategoriId) {
    query += ` AND EXISTS (
      SELECT 1 FROM "produk_master" pm
      JOIN "produk" p ON p.produk_master_id = pm.id
      WHERE pm.id = (
        SELECT produk_master_id FROM "produk" WHERE id = pk.produk_id
      ) AND pm.kategori_id = $${paramIndex}
    )`;
    params.push(kategoriId);
    paramIndex++;
  }

  if (daysThreshold) {
    query += ` AND pk.hari_tersisa <= $${paramIndex}`;
    params.push(daysThreshold);
    paramIndex++;
  }

  if (statusKadaluarsa) {
    query += ` AND pk.status_kadaluarsa = $${paramIndex}`;
    params.push(statusKadaluarsa);
    paramIndex++;
  }

  // Get total count
  const countQuery = query.replace(
    /SELECT[\s\S]+?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  const total = Number(countResult[0].total);

  // Add pagination and ordering
  const offset = (page - 1) * limit;
  query += ` ORDER BY pk.hari_tersisa ASC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  // Execute query
  const products = await prisma.$queryRawUnsafe(query, ...params);

  // Calculate summary statistics
  const summary = {
    totalProducts: products.length,
    totalItemsExpiring: products.reduce((sum, p) => sum + Number(p.stok), 0),
    totalValueAtRisk: products.reduce(
      (sum, p) => sum + Number(p.harga_jual) * Number(p.stok),
      0
    ),
    expiredItems: products.filter((p) => p.status_kadaluarsa === "Kadaluarsa")
      .length,
    criticalItems: products.filter(
      (p) => p.status_kadaluarsa === "Kritis (< 7 hari)"
    ).length,
    warningItems: products.filter(
      (p) => p.status_kadaluarsa === "Perhatian (< 30 hari)"
    ).length,
    cautionItems: products.filter(
      (p) => p.status_kadaluarsa === "Waspada (< 90 hari)"
    ).length,
  };

  // Group by status
  const statusSummary = {
    Kadaluarsa: products.filter((p) => p.status_kadaluarsa === "Kadaluarsa")
      .length,
    "Kritis (< 7 hari)": products.filter(
      (p) => p.status_kadaluarsa === "Kritis (< 7 hari)"
    ).length,
    "Perhatian (< 30 hari)": products.filter(
      (p) => p.status_kadaluarsa === "Perhatian (< 30 hari)"
    ).length,
    "Waspada (< 90 hari)": products.filter(
      (p) => p.status_kadaluarsa === "Waspada (< 90 hari)"
    ).length,
    Aman: products.filter((p) => p.status_kadaluarsa === "Aman").length,
  };

  // Group by branch
  const branchSummary = {};
  products.forEach((p) => {
    if (!branchSummary[p.cabang_id]) {
      branchSummary[p.cabang_id] = {
        cabangId: p.cabang_id,
        namaCabang: p.nama_cabang,
        totalProducts: 0,
        totalItems: 0,
        totalValueAtRisk: 0,
      };
    }
    branchSummary[p.cabang_id].totalProducts++;
    branchSummary[p.cabang_id].totalItems += Number(p.stok);
    branchSummary[p.cabang_id].totalValueAtRisk +=
      Number(p.harga_jual) * Number(p.stok);
  });

  return {
    summary,
    statusSummary,
    branchSummary: Object.values(branchSummary),
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get expiring products summary by category
 * @param {Object} filters - Filter options
 * @returns {Object} Summary by category
 */
const getExpiringByCategory = async (filters) => {
  const { cabangId, daysThreshold = 90 } = filters;

  const query = `
    SELECT 
      pm.kategori_id,
      k.nama_kategori,
      COUNT(*) as total_products,
      SUM(p.stok) as total_stock,
      SUM(p.harga_jual * p.stok) as total_value,
      AVG(pk.hari_tersisa) as avg_days_remaining
    FROM vw_produk_akan_kadaluarsa pk
    JOIN "produk" p ON p.id = pk.produk_id
    JOIN "produk_master" pm ON pm.id = p.produk_master_id
    LEFT JOIN "kategori" k ON k.id = pm.kategori_id
    WHERE 1=1
    ${cabangId ? `AND pk.cabang_id = ${cabangId}` : ""}
    AND pk.hari_tersisa <= ${daysThreshold}
    GROUP BY pm.kategori_id, k.nama_kategori
    ORDER BY total_value DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

module.exports = {
  getExpiringProductsReport,
  getExpiringByCategory,
};