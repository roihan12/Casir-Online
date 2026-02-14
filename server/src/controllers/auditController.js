const auditService = require("../services/auditService");
const { validate } = require("../validation/validation");
const {
  getAuditLogsValidation,
  exportAuditLogsValidation,
} = require("../validation/auditValidation");

const getAuditLogs = async (req, res, next) => {
  try {
    const filters = validate(getAuditLogsValidation, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      action: req.query.action,
      tableName: req.query.tableName,
      cabangId: req.query.cabangId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await auditService.getAuditLogs(filters);

    res.status(200).json({
      status: true,
      message: "Success get audit logs",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const exportAuditLogs = async (req, res, next) => {
  try {
    const filters = validate(exportAuditLogsValidation, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      action: req.query.action,
      tableName: req.query.tableName,
      cabangId: req.query.cabangId,
    });

    const csvData = await auditService.exportAuditLogs(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

const getAuditLogDetail = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const auditLog = await auditService.getAuditLogDetail(logId);

    res.status(200).json({
      status: true,
      message: "Success get audit log detail",
      data: auditLog,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLogs,
  getAuditLogDetail,
};
