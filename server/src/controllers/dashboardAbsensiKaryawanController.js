const dashboardAbsensiKaryawanService = require("../services/dashboardAbsensiKaryawanService");

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const result = await dashboardAbsensiKaryawanService.getMe(userId, date);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getRekapBulan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const result = await dashboardAbsensiKaryawanService.getRekapBulan(userId, month, year);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSaldoCuti = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;
    const result = await dashboardAbsensiKaryawanService.getSaldoCuti(userId, year);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSlipTerbaru = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await dashboardAbsensiKaryawanService.getSlipTerbaru(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getJadwalMingguIni = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const result = await dashboardAbsensiKaryawanService.getJadwalMingguIni(userId, date);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  getRekapBulan,
  getSaldoCuti,
  getSlipTerbaru,
  getJadwalMingguIni,
};
