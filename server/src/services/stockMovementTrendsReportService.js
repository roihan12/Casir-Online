const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const getStockMovementTrends = async (filters) => {
  const {
    cabangId,
    produkId,
    kategoriId,
    startDate,
    endDate,
    interval = 'day',
    page = 1,
    limit = 10,
  } = filters;

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  let query = `
    SELECT * FROM get_pergerakan_stok(
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )
  `;

  const params = [
    cabangId || null,
    produkId || null,
    kategoriId || null,
    start,
    end,
    interval,
  ];

  const result = await prisma.$queryRawUnsafe(query, ...params);

  const offset = (page - 1) * limit;
  const paginatedResult = result.slice(offset, offset + limit);

  const summary = {
    totalPeriods: result.length,
    totalStockIn: result.reduce((sum, r) => sum + Number(r.stok_masuk), 0),
    totalStockOut: result.reduce((sum, r) => sum + Number(r.stok_keluar), 0),
    netChange: result.reduce((sum, r) => sum + Number(r.perubahan_bersih), 0),
    totalTransactions: result.reduce((sum, r) => sum + Number(r.jumlah_transaksi), 0),
    avgStockInPerPeriod: result.length > 0 ? result.reduce((sum, r) => sum + Number(r.stok_masuk), 0) / result.length : 0,
    avgStockOutPerPeriod: result.length > 0 ? result.reduce((sum, r) => sum + Number(r.stok_keluar), 0) / result.length : 0,
  };

  return {
    summary,
    trends: paginatedResult,
    pagination: {
      page,
      limit,
      total: result.length,
      totalPages: Math.ceil(result.length / limit),
    },
  };
};

const getTopMovingProducts = async (filters) => {
  const {
    cabangId,
    kategoriId,
    startDate,
    endDate,
    limit = 10,
    sortBy = 'total',
  } = filters;

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const query = `
    SELECT * FROM get_produk_pergerakan_tertinggi(
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )
  `;

  const params = [
    cabangId || null,
    kategoriId || null,
    start,
    end,
    limit,
    sortBy,
  ];

  const result = await prisma.$queryRawUnsafe(query, ...params);

  const summary = {
    totalProducts: result.length,
    totalStockIn: result.reduce((sum, r) => sum + Number(r.total_stok_masuk), 0),
    totalStockOut: result.reduce((sum, r) => sum + Number(r.total_stok_keluar), 0),
    totalMovement: result.reduce((sum, r) => sum + Number(r.total_pergerakan), 0),
    totalCurrentStock: result.reduce((sum, r) => sum + Number(r.stok_saat_ini), 0),
  };

  return {
    summary,
    products: result,
  };
};

const getStockMovementByCategory = async (filters) => {
  const { cabangId, startDate, endDate } = filters;

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  let whereClause = 'WHERE 1=1';
  if (cabangId) {
    whereClause += ` AND cabang_id = '${cabangId}'`;
  }

  const query = `
    SELECT 
      psk.bulan,
      psk.cabang_id,
      psk.nama_cabang,
      psk.kategori_id,
      psk.nama_kategori,
      SUM(psk.stok_masuk) as total_stok_masuk,
      SUM(psk.stok_keluar) as total_stok_keluar,
      SUM(psk.perubahan_bersih) as total_perubahan_bersih,
      SUM(psk.jumlah_produk) as total_jumlah_produk,
      SUM(psk.jumlah_transaksi) as total_jumlah_transaksi
    FROM vw_pergerakan_stok_kategori psk
    WHERE psk.bulan >= $1 AND psk.bulan <= $2
    ${cabangId ? `AND psk.cabang_id = '${cabangId}'` : ''}
    GROUP BY psk.bulan, psk.cabang_id, psk.nama_cabang, psk.kategori_id, psk.nama_kategori
    ORDER BY psk.bulan DESC, total_stok_keluar DESC
  `;

  const result = await prisma.$queryRawUnsafe(query, start, end);

  const summary = {
    totalCategories: [...new Set(result.map(r => r.kategori_id))].length,
    totalStockIn: result.reduce((sum, r) => sum + Number(r.total_stok_masuk), 0),
    totalStockOut: result.reduce((sum, r) => sum + Number(r.total_stok_keluar), 0),
    totalTransactions: result.reduce((sum, r) => sum + Number(r.total_jumlah_transaksi), 0),
  };

  return {
    summary,
    movements: result,
  };
};

const getInventoryValueByCategory = async (filters) => {
  const { cabangId, kategoriId } = filters;

  const result = await prisma.$queryRawUnsafe(`
    SELECT * FROM get_nilai_inventori_kategori($1, $2)
  `, cabangId || null, kategoriId || null);

  const summary = {
    totalCategories: result.length,
    totalInventoryValueBuy: result.reduce((sum, r) => sum + Number(r.nilai_inventori_beli), 0),
    totalInventoryValueSell: result.reduce((sum, r) => sum + Number(r.nilai_inventori_jual), 0),
    totalPotentialProfit: result.reduce((sum, r) => sum + Number(r.potensi_keuntungan), 0),
    avgMargin: result.length > 0 ? result.reduce((sum, r) => sum + Number(r.persentase_margin), 0) / result.length : 0,
  };

  return {
    summary,
    categories: result,
  };
};

const getRecentInventoryActivities = async (filters) => {
  const {
    cabangId,
    produkId,
    referenceType,
    userId,
    startDate,
    endDate,
    limit = 50,
  } = filters;

  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const query = `
    SELECT * FROM get_aktivitas_inventori(
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
  `;

  const params = [
    cabangId || null,
    produkId || null,
    referenceType || null,
    userId || null,
    start,
    end,
    limit,
  ];

  const result = await prisma.$queryRawUnsafe(query, ...params);

  const summary = {
    totalActivities: result.length,
    totalStockIn: result.filter(r => r.jenis_pergerakan === 'Masuk').reduce((sum, r) => sum + Number(r.jumlah), 0),
    totalStockOut: result.filter(r => r.jenis_pergerakan === 'Keluar').reduce((sum, r) => sum + Number(r.jumlah), 0),
    byActivityType: {},
    byReferenceType: {},
  };

  result.forEach(r => {
    if (!summary.byActivityType[r.jenis_pergerakan]) {
      summary.byActivityType[r.jenis_pergerakan] = { count: 0, total: 0 };
    }
    summary.byActivityType[r.jenis_pergerakan].count++;
    summary.byActivityType[r.jenis_pergerakan].total += Number(r.jumlah);

    if (!summary.byReferenceType[r.tipe_aktivitas]) {
      summary.byReferenceType[r.tipe_aktivitas] = 0;
    }
    summary.byReferenceType[r.tipe_aktivitas]++;
  });

  return {
    summary,
    activities: result,
  };
};

module.exports = {
  getStockMovementTrends,
  getTopMovingProducts,
  getStockMovementByCategory,
  getInventoryValueByCategory,
  getRecentInventoryActivities,
};
