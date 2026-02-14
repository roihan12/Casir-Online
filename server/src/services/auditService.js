const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const getAuditLogs = async (filters) => {
  const { startDate, endDate, userId, action, tableName, cabangId, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where = {};
  if (userId) where.user_id = userId;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (tableName) where.table_name = { contains: tableName, mode: "insensitive" };
  if (cabangId) where.cabang_id = cabangId;

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = new Date(startDate);
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      where.created_at.lte = endDateObj;
    }
  }

  // Parallel queries for performance
  const [totalCount, auditLogs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
  ]);

  // Parse JSON fields
  const parsedLogs = auditLogs.map(log => ({
    ...log,
    old_values: log.old_values ? JSON.parse(log.old_values) : null,
    new_values: log.new_values ? JSON.parse(log.new_values) : null,
  }));

  return {
    data: parsedLogs,
    pagination: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
};

const exportAuditLogs = async (filters) => {
  const { startDate, endDate, userId, action, tableName, cabangId } = filters;

  // Build where clause (same as getAuditLogs but without pagination)
  const where = {};
  if (userId) where.user_id = userId;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (tableName) where.table_name = { contains: tableName, mode: "insensitive" };
  if (cabangId) where.cabang_id = cabangId;

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = new Date(startDate);
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      where.created_at.lte = endDateObj;
    }
  }

  const auditLogs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          namaLengkap: true,
          email: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Generate CSV
  let csvContent = "Log ID,Tanggal,User ID,Username,User Email,Action,Tabel Name,Record ID,Cabang ID,IP Address,Old Values,New Values\n";

  for (const log of auditLogs) {
    const row = [
      log.log_id,
      formatDateTime(log.created_at),
      log.user_id || "",
      log.user?.namaLengkap || "",
      log.user?.email || "",
      `"${log.action.replace(/"/g, '""')}"`,
      `"${(log.table_name || "").replace(/"/g, '""')}"`,
      log.record_id || "",
      log.cabang_id || "",
      log.ip_address || "",
      `"${(log.old_values || "").replace(/"/g, '""')}"`,
      `"${(log.new_values || "").replace(/"/g, '""')}"`,
    ].join(",");
    csvContent += row + "\n";
  }

  return csvContent;
};

const getAuditLogDetail = async (logId) => {
  const auditLog = await prisma.auditLog.findUnique({
    where: { log_id: logId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          namaLengkap: true,
          email: true,
          telepon: true,
        },
      },
    },
  });

  if (!auditLog) {
    throw new ResponseError(404, "Audit log not found");
  }

  return {
    ...auditLog,
    old_values: auditLog.old_values ? JSON.parse(auditLog.old_values) : null,
    new_values: auditLog.new_values ? JSON.parse(auditLog.new_values) : null,
  };
};

const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

module.exports = {
  getAuditLogs,
  exportAuditLogs,
  getAuditLogDetail,
};
