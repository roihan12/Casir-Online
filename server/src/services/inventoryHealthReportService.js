const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const getInventoryHealthReport = async (filters) => {
  const {
    cabangId,
    kategoriId,
    healthStatus,
    page = 1,
    limit = 10,
  } = filters;

  let query = `
    SELECT 
      ih.cabang_id,
      ih.nama_cabang,
      ih.produk_id,
      ih.produk_master_id,
      ih.nama_produk,
      ih.sku,
      ih.stok,
      ih.stok_minimum,
      ih.stok_maksimum,
      ih.tanggal_kadaluarsa,
      ih.stock_level_score,
      ih.expiration_score,
      ih.movement_score,
      ih.financial_score,
      ih.overall_health_score,
      ih.health_status
    FROM view_inventory_health_score ih
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (cabangId) {
    query += ` AND ih.cabang_id = $${paramIndex}`;
    params.push(cabangId);
    paramIndex++;
  }

  if (kategoriId) {
    query += ` AND EXISTS (
      SELECT 1 FROM "produk_master" pm
      JOIN "produk" p ON p.produk_master_id = pm.id
      WHERE pm.id = ih.produk_master_id AND pm.kategori_id = $${paramIndex}
    )`;
    params.push(kategoriId);
    paramIndex++;
  }

  if (healthStatus) {
    query += ` AND ih.health_status = $${paramIndex}`;
    params.push(healthStatus);
    paramIndex++;
  }

  const countQuery = query.replace(
    /SELECT[\s\S]+?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  const total = Number(countResult[0].total);

  const offset = (page - 1) * limit;
  query += ` ORDER BY ih.overall_health_score ASC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const products = await prisma.$queryRawUnsafe(query, ...params);

  const summary = {
    totalProducts: products.length,
    avgHealthScore: products.length > 0 
      ? products.reduce((sum, p) => sum + Number(p.overall_health_score), 0) / products.length 
      : 0,
    excellent: products.filter((p) => p.health_status === 'Excellent').length,
    good: products.filter((p) => p.health_status === 'Good').length,
    fair: products.filter((p) => p.health_status === 'Fair').length,
    poor: products.filter((p) => p.health_status === 'Poor').length,
    avgStockLevelScore: products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.stock_level_score), 0) / products.length
      : 0,
    avgExpirationScore: products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.expiration_score), 0) / products.length
      : 0,
    avgMovementScore: products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.movement_score), 0) / products.length
      : 0,
    avgFinancialScore: products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.financial_score), 0) / products.length
      : 0,
  };

  const healthStatusSummary = {
    Excellent: products.filter((p) => p.health_status === 'Excellent').length,
    Good: products.filter((p) => p.health_status === 'Good').length,
    Fair: products.filter((p) => p.health_status === 'Fair').length,
    Poor: products.filter((p) => p.health_status === 'Poor').length,
  };

  return {
    summary,
    healthStatusSummary,
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getBranchInventoryHealth = async (filters) => {
  const { cabangId } = filters;

  let whereClause = 'WHERE 1=1';
  if (cabangId) {
    whereClause += ` AND cabang_id = '${cabangId}'`;
  }

  const query = `
    SELECT 
      bhs.cabang_id,
      bhs.nama_cabang,
      bhs.total_products,
      bhs.avg_stock_level_score,
      bhs.avg_expiration_score,
      bhs.avg_movement_score,
      bhs.avg_financial_score,
      bhs.avg_overall_health_score,
      bhs.branch_health_status,
      bhs.products_needing_attention,
      bhs.healthy_products_percentage
    FROM view_branch_inventory_health_score bhs
    ${whereClause}
    ORDER BY bhs.avg_overall_health_score DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

const getHealthScoreDistribution = async (filters) => {
  const { cabangId } = filters;

  let whereClause = 'WHERE 1=1';
  if (cabangId) {
    whereClause += ` AND cabang_id = '${cabangId}'`;
  }

  const query = `
    SELECT 
      CASE 
        WHEN overall_health_score >= 80 THEN 'Excellent (80-100)'
        WHEN overall_health_score >= 60 THEN 'Good (60-79)'
        WHEN overall_health_score >= 40 THEN 'Fair (40-59)'
        ELSE 'Poor (0-39)'
      END AS score_range,
      COUNT(*) as product_count,
      AVG(overall_health_score) as avg_score
    FROM view_inventory_health_score
    ${whereClause}
    GROUP BY score_range
    ORDER BY MIN(overall_health_score) DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

const getHealthByDimension = async (filters) => {
  const { cabangId } = filters;

  let whereClause = 'WHERE 1=1';
  if (cabangId) {
    whereClause += ` AND cabang_id = '${cabangId}'`;
  }

  const query = `
    SELECT 
      'Stock Level' as dimension,
      AVG(stock_level_score) as avg_score,
      MIN(stock_level_score) as min_score,
      MAX(stock_level_score) as max_score
    FROM view_inventory_health_score
    ${whereClause}
    
    UNION ALL
    
    SELECT 
      'Expiration' as dimension,
      AVG(expiration_score) as avg_score,
      MIN(expiration_score) as min_score,
      MAX(expiration_score) as max_score
    FROM view_inventory_health_score
    ${whereClause}
    
    UNION ALL
    
    SELECT 
      'Movement' as dimension,
      AVG(movement_score) as avg_score,
      MIN(movement_score) as min_score,
      MAX(movement_score) as max_score
    FROM view_inventory_health_score
    ${whereClause}
    
    UNION ALL
    
    SELECT 
      'Financial' as dimension,
      AVG(financial_score) as avg_score,
      MIN(financial_score) as min_score,
      MAX(financial_score) as max_score
    FROM view_inventory_health_score
    ${whereClause}
    
    ORDER BY avg_score DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

module.exports = {
  getInventoryHealthReport,
  getBranchInventoryHealth,
  getHealthScoreDistribution,
  getHealthByDimension,
};
