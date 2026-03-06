const laporanKehadiranService = require("../services/laporanKehadiranService");

const getPreviewLaporan = async (req, res, next) => {
  try {
    const result = await laporanKehadiranService.getPreviewLaporan(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    await laporanKehadiranService.exportExcel(req.query, res);
  } catch (error) {
    next(error);
  }
};

const exportPDF = async (req, res, next) => {
  try {
    await laporanKehadiranService.exportPDF(req.query, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreviewLaporan,
  exportExcel,
  exportPDF,
};
