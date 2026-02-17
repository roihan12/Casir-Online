const jadwalService = require("../services/jadwalService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createJadwalValidation,
  generateJadwalValidation,
  updateJadwalValidation,
  getJadwalValidation,
  jadwalIdValidation,
} = require("../validation/jadwalValidation");
const { generateJadwalReguSchema } = require("../validation/reguValidation");

/**
 * Create a single work schedule
 */
const createJadwal = async (req, res, next) => {
  try {
    const request = validate(createJadwalValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await jadwalService.createJadwal(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate schedules in bulk for multiple users
 */
const generateJadwalBulk = async (req, res, next) => {
  try {
    const request = validate(generateJadwalValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await jadwalService.generateJadwalBulk(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Schedules generated successfully",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};


const generateJadwalReguRolling = async (req, res, next) => {
  try {
    const request = validate(generateJadwalReguSchema, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await jadwalService.generateJadwalReguRolling(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Schedules generated successfully",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};





/**
 * Get schedules with filtering and pagination
 */
const getJadwal = async (req, res, next) => {
  try {
    const filters = validate(getJadwalValidation, {
      userId: req.query.userId,
      cabangId: req.query.cabangId,
      tanggalMulai: req.query.tanggalMulai,
      tanggalSelesai: req.query.tanggalSelesai,
      tipeJadwal: req.query.tipeJadwal,
      shiftId: req.query.shiftId,
      reguId: req.query.reguId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await jadwalService.getJadwal(filters);

    res.status(200).json({
      success: true,
      message: "Schedules retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single schedule by ID
 */
const getJadwalById = async (req, res, next) => {
  try {
    const { id } = validate(jadwalIdValidation, req.params);

    const result = await jadwalService.getJadwalById(id);

    res.status(200).json({
      success: true,
      message: "Schedule retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a schedule
 */
const updateJadwal = async (req, res, next) => {
  try {
    const { id } = validate(jadwalIdValidation, req.params);
    const request = validate(updateJadwalValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await jadwalService.updateJadwal(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a schedule
 */
const deleteJadwal = async (req, res, next) => {
  try {
    const { id } = validate(jadwalIdValidation, req.params);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await jadwalService.deleteJadwal(id, auditInfo);

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJadwal,
  generateJadwalBulk,
  getJadwal,
  getJadwalById,
  updateJadwal,
  deleteJadwal,
  generateJadwalReguRolling,
};
