const dashboardAbsensiAdminService = require("../services/dashboardAbsensiAdminService");

const getHariIni = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { date } = req.query;
    const result = await dashboardAbsensiAdminService.getHariIni(cabangId, date);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getBelumAbsen = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { date } = req.query;
    const result = await dashboardAbsensiAdminService.getBelumAbsen(cabangId, date);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTren = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { periode = 'bulan' } = req.query;
    const result = await dashboardAbsensiAdminService.getTren(cabangId, periode);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTopTerlambat = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { month, year } = req.query;
    const result = await dashboardAbsensiAdminService.getTopTerlambat(cabangId, parseInt(month), parseInt(year));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getRekapLembur = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { month, year } = req.query;
    const result = await dashboardAbsensiAdminService.getRekapLembur(cabangId, parseInt(month), parseInt(year));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPendingApproval = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const result = await dashboardAbsensiAdminService.getPendingApproval(cabangId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHariIni,
  getBelumAbsen,
  getTren,
  getTopTerlambat,
  getRekapLembur,
  getPendingApproval,
};
