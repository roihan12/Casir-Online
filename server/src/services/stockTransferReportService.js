const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const getStockTransferReport = async (filters) => {
  const {
    cabangId,
    status,
    dateRange,
    page = 1,
    limit = 10,
  } = filters;

  let query = `
    SELECT 
      st.transfer_id,
      st.nomor_transfer,
      st.cabang_asal,
      st.cabang_tujuan,
      st.tanggal_kirim,
      st.tanggal_terima,
      st.status,
      st.keterangan,
      st.created_at,
      st.updated_at,
      st.created_by_name,
      st.jumlah_item,
      st.total_barang_kirim,
      st.total_barang_terima,
      st.status_text,
      st.status_style
    FROM vw_transfer_antar_cabang st
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (cabangId) {
    query += ` AND (st.cabang_asal = $${paramIndex} OR st.cabang_tujuan = $${paramIndex})`;
    params.push(cabangId);
    paramIndex++;
  }

  if (status) {
    query += ` AND st.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (dateRange) {
    const startDate = getStartDate(dateRange);
    if (startDate) {
      query += ` AND st.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
  }

  const countQuery = query.replace(
    /SELECT[\s\S]+?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  const total = Number(countResult[0].total);

  const offset = (page - 1) * limit;
  query += ` ORDER BY st.created_at DESC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const transfers = await prisma.$queryRawUnsafe(query, ...params);

  const summary = {
    totalTransfers: transfers.length,
    totalItemsTransferred: transfers.reduce((sum, t) => sum + Number(t.jumlah_item), 0),
    totalItemsSent: transfers.reduce((sum, t) => sum + Number(t.total_barang_kirim), 0),
    totalItemsReceived: transfers.reduce((sum, t) => sum + Number(t.total_barang_terima), 0),
    pendingTransfers: transfers.filter((t) => t.status === 'pending_approval' || t.status === 'approved').length,
    inTransit: transfers.filter((t) => t.status === 'sent').length,
    completedTransfers: transfers.filter((t) => t.status === 'received').length,
  };

  const statusSummary = {
    Draft: transfers.filter((t) => t.status === 'draft').length,
    Menunggu_Persetujuan: transfers.filter((t) => t.status === 'pending_approval').length,
    Disetujui: transfers.filter((t) => t.status === 'approved').length,
    Ditolak: transfers.filter((t) => t.status === 'rejected').length,
    Dikirim: transfers.filter((t) => t.status === 'sent').length,
    Diterima: transfers.filter((t) => t.status === 'received').length,
    Dibatalkan: transfers.filter((t) => t.status === 'cancelled').length,
  };

  const branchSummary = {};
  transfers.forEach((t) => {
    if (!branchSummary[t.cabang_asal]) {
      branchSummary[t.cabang_asal] = {
        cabangName: t.cabang_asal,
        asTotalTransfers: 0,
        asItemsSent: 0,
        asItemsReceived: 0,
      };
    }
    branchSummary[t.cabang_asal].asTotalTransfers++;
    branchSummary[t.cabang_asal].asItemsSent += Number(t.total_barang_kirim);

    if (!branchSummary[t.cabang_tujuan]) {
      branchSummary[t.cabang_tujuan] = {
        cabangName: t.cabang_tujuan,
        asTotalTransfers: 0,
        asItemsSent: 0,
        asItemsReceived: 0,
      };
    }
    branchSummary[t.cabang_tujuan].asTotalTransfers++;
    branchSummary[t.cabang_tujuan].asItemsReceived += Number(t.total_barang_terima);
  });

  return {
    summary,
    statusSummary,
    branchSummary: Object.values(branchSummary),
    transfers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getStockTransferByBranch = async (filters) => {
  const { cabangId, startDate, endDate } = filters;

  let whereClause = 'WHERE 1=1';
  if (cabangId) {
    whereClause += ` AND (st.cabang_asal = '${cabangId}' OR st.cabang_tujuan = '${cabangId}')`;
  }
  if (startDate) {
    whereClause += ` AND st.created_at >= '${startDate}'`;
  }
  if (endDate) {
    whereClause += ` AND st.created_at <= '${endDate}'`;
  }

  const query = `
    SELECT 
      st.cabang_asal,
      st.cabang_tujuan,
      COUNT(*) as total_transfers,
      SUM(st.total_barang_kirim) as total_barang_kirim,
      SUM(st.total_barang_terima) as total_barang_terima,
      SUM(st.jumlah_item) as total_items,
      SUM(CASE WHEN st.status = 'received' THEN 1 ELSE 0 END) as completed_transfers,
      SUM(CASE WHEN st.status = 'sent' THEN 1 ELSE 0 END) as in_transit
    FROM vw_transfer_antar_cabang st
    ${whereClause}
    GROUP BY st.cabang_asal, st.cabang_tujuan
    ORDER BY total_barang_kirim DESC
  `;

  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case '7days':
      return new Date(now.setDate(now.getDate() - 7));
    case '30days':
      return new Date(now.setDate(now.getDate() - 30));
    case '90days':
      return new Date(now.setDate(now.getDate() - 90));
    case '6months':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
}

module.exports = {
  getStockTransferReport,
  getStockTransferByBranch,
};
