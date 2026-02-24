const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { sanitizeBigInt } = require("../utils/bigintSerializer");

const getLowStockReport = async (filters) => {
  const {
    cabangId,
    kategoriId,
    stokStatus,
    page = 1,
    limit = 10,
  } = filters;

  const numLimit = parseInt(limit, 10);
  const numPage = parseInt(page, 10);

  let query = `
    SELECT 
      ps.produk_id,
      ps.cabang_id,
      ps.nama_cabang,
      ps.nama_produk,
      ps.sku,
      ps.barcode,
      ps.stok,
      ps.min_stok,
      ps.max_stok,
      ps.harga_beli,
      ps.harga_jual,
      ps.status,
      ps.is_low_stock,
      ps.stok_status,
      ps.updated_at,
      ps.stok_percentage
    FROM vw_produk_stok_menipis ps
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (cabangId) {
    query += ` AND ps.cabang_id = $${paramIndex}`;
    params.push(cabangId);
    paramIndex++;
  }

  if (kategoriId) {
    query += ` AND EXISTS (
      SELECT 1 FROM "produk_master" pm
      JOIN "produk" p ON p.produk_master_id = pm.id
      WHERE pm.id = (
        SELECT produk_master_id FROM "produk" WHERE id = ps.produk_id
      ) AND pm.kategori_id = $${paramIndex}
    )`;
    params.push(kategoriId);
    paramIndex++;
  }

  if (stokStatus) {
    query += ` AND ps.stok_status = $${paramIndex}`;
    params.push(stokStatus);
    paramIndex++;
  }

  const countQuery = query.replace(
    /SELECT[\s\S]+?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  const total = Number(countResult[0].total);

  const offset = (numPage - 1) * numLimit;
  query += ` ORDER BY ps.stok_percentage ASC, ps.updated_at DESC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(numLimit, offset);

  const products = await prisma.$queryRawUnsafe(query, ...params);

  const summary = {
    totalProducts: total,
    outOfStock: products.filter((p) => p.stok_status === "Habis").length,
    lowStock: products.filter((p) => p.stok_status === "Menipis").length,
    totalItemsBelowMin: products.reduce((sum, p) => sum + Number(p.stok), 0),
    totalValueAtRisk: products.reduce(
      (sum, p) => sum + Number(p.harga_jual) * Number(p.stok),
      0
    ),
  };

  const statusSummary = {
    Habis: products.filter((p) => p.stok_status === "Habis").length,
    Menipis: products.filter((p) => p.stok_status === "Menipis").length,
  };

  const branchSummary = {};
  products.forEach((p) => {
    if (!branchSummary[p.cabang_id]) {
      branchSummary[p.cabang_id] = {
        cabangId: p.cabang_id,
        namaCabang: p.nama_cabang,
        totalProducts: 0,
        outOfStock: 0,
        lowStock: 0,
        totalItems: 0,
        totalValueAtRisk: 0,
      };
    }
    branchSummary[p.cabang_id].totalProducts++;
    if (p.stok_status === "Habis") {
      branchSummary[p.cabang_id].outOfStock++;
    } else if (p.stok_status === "Menipis") {
      branchSummary[p.cabang_id].lowStock++;
    }
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

const getLowStockByCategory = async (filters) => {
  const { cabangId } = filters;

  // Build cabang filter
  let cabangFilter = "";
  if (cabangId && cabangId !== "all") {
    const ids = cabangId.split(",").map((id) => `'${id.trim()}'`).filter(Boolean);
    if (ids.length === 1) {
      cabangFilter = `AND ps.cabang_id = ${ids[0]}`;
    } else if (ids.length > 1) {
      cabangFilter = `AND ps.cabang_id IN (${ids.join(", ")})`;
    }
  }

  const query = `
    SELECT 
      pm.kategori_id,
      k.nama_kategori,
      COUNT(*) as total_products,
      SUM(p.stok) as total_stock,
      SUM(p.harga_jual * p.stok) as total_value,
      SUM(CASE WHEN p.stok = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
      AVG(p.stok::float / NULLIF(p.min_stok, 0)::float * 100) as avg_stock_percentage
    FROM vw_produk_stok_menipis ps
    JOIN "produk" p ON p.produk_id = ps.produk_id
    JOIN "produk_master" pm ON pm.produk_master_id = p.produk_master_id
    LEFT JOIN "kategori" k ON k.kategori_id = pm.kategori_id
    WHERE 1=1
    ${cabangFilter}
    GROUP BY pm.kategori_id, k.nama_kategori
    ORDER BY total_value DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return sanitizeBigInt(result);
};

module.exports = {
  getLowStockReport,
  getLowStockByCategory,
};
