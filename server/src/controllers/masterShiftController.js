const masterShiftService = require("../services/masterShiftService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createMasterShiftValidation,
  updateMasterShiftValidation,
  getMasterShiftsValidation,
  masterShiftIdValidation,
} = require("../validation/masterShiftValidation");

/**
 * Create a new master shift type
 */
const createMasterShift = async (req, res, next) => {
  try {
    const request = validate(createMasterShiftValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await masterShiftService.createMasterShift(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Master shift created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all master shifts with filtering
 */
const getMasterShifts = async (req, res, next) => {
  try {
    const filters = validate(getMasterShiftsValidation, {
      cabangId: req.query.cabangId,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await masterShiftService.getMasterShifts(filters);

    res.status(200).json({
      success: true,
      message: "Master shifts retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single master shift by ID
 */
const getMasterShiftById = async (req, res, next) => {
  try {
    const { id } = validate(masterShiftIdValidation, req.params);

    const result = await masterShiftService.getMasterShiftById(id);

    res.status(200).json({
      success: true,
      message: "Master shift retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a master shift
 */
const updateMasterShift = async (req, res, next) => {
  try {
    const { id } = validate(masterShiftIdValidation, req.params);
    const request = validate(updateMasterShiftValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await masterShiftService.updateMasterShift(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Master shift updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete (deactivate) a master shift
 */
const deleteMasterShift = async (req, res, next) => {
  try {
    const { id } = validate(masterShiftIdValidation, req.params);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await masterShiftService.deleteMasterShift(id, auditInfo);

    res.status(200).json({
      success: true,
      message: "Master shift deactivated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMasterShift,
  getMasterShifts,
  getMasterShiftById,
  updateMasterShift,
  deleteMasterShift,
};
