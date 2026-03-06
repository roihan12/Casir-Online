const laporanPayrollService = require("../services/laporanPayrollService");

const getPreviewPayroll = async (req, res, next) => {
  try {
    const result = await laporanPayrollService.getPreviewPayroll(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    await laporanPayrollService.exportExcel(req.query, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreviewPayroll,
  exportExcel,
};
