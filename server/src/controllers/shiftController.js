const shiftService = require("../services/shiftService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  openShiftValidation,
  closeShiftValidation,
  adjustShiftValidation,
  getShiftsValidation,
} = require("../validation/shiftValidation");

// Controller untuk membuka shift baru
const openShift = async (req, res, next) => {
  try {
    const request = validate(openShiftValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await shiftService.openShift(request, {
      userId,
      ipAddress,
    });

    res.status(201).json({
      status: true,
      message: "Shift berhasil dibuka",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menutup shift
const closeShift = async (req, res, next) => {
  try {
    const request = validate(closeShiftValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await shiftService.closeShift(request, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Shift berhasil ditutup",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menyesuaikan shift
const adjustShift = async (req, res, next) => {
  try {
    const request = validate(adjustShiftValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await shiftService.adjustShift(request, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Shift berhasil disesuaikan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan shift aktif
const getActiveShift = async (req, res, next) => {
  try {
    // Default to current user, but allow checking other users with proper permission
    const userId = req.query.userId || req.user.id;

    const result = await shiftService.getActiveShift(userId);

    res.status(200).json({
      status: true,
      message: result ? "Shift aktif ditemukan" : "Tidak ada shift aktif",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan detail shift
const getShiftById = async (req, res, next) => {
  try {
    const shiftId = req.params.id;

    if (!shiftId) {
      throw new ResponseError(400, "shiftId diperlukan");
    }

    const result = await shiftService.getShiftById(shiftId);

    res.status(200).json({
      status: true,
      message: "Detail shift berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar shift
const getShifts = async (req, res, next) => {
  try {
    const filters = validate(getShiftsValidation, {
      cabangId: req.query.cabangId,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await shiftService.getShifts(filters);

    res.status(200).json({
      status: true,
      message: "Daftar shift berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan laporan shift
const getShiftReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await shiftService.getShiftReport(filters);

    res.status(200).json({
      status: true,
      message: "Laporan shift berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openShift,
  closeShift,
  adjustShift,
  getActiveShift,
  getShiftById,
  getShifts,
  getShiftReport,
};
