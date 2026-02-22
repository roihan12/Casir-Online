const koreksiAbsensiService = require("../services/koreksiAbsensiService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createKoreksiValidation,
  approveKoreksiValidation,
  rejectKoreksiValidation,
  getKoreksiValidation,
  koreksiIdValidation,
  createAbsensiManualValidation,
} = require("../validation/koreksiAbsensiValidation");

/**
 * Submit a new attendance correction request
 */
const createKoreksi = async (req, res, next) => {
  try {
    const request = validate(createKoreksiValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await koreksiAbsensiService.createKoreksi(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Correction request submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get correction requests with filtering
 */
const getKoreksi = async (req, res, next) => {
  try {
    const filters = validate(getKoreksiValidation, {
      userId: req.query.userId,
      cabangId: req.query.cabangId,
      status: req.query.status,
      tanggalMulai: req.query.tanggalMulai,
      tanggalSelesai: req.query.tanggalSelesai,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await koreksiAbsensiService.getKoreksi(filters);

    res.status(200).json({
      success: true,
      message: "Correction requests retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single correction request by ID
 */
const getKoreksiById = async (req, res, next) => {
  try {
    const { id } = validate(koreksiIdValidation, req.params);

    const result = await koreksiAbsensiService.getKoreksiById(id);

    res.status(200).json({
      success: true,
      message: "Correction request retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a correction request
 */
const approveKoreksi = async (req, res, next) => {
  try {
    const { id } = validate(koreksiIdValidation, req.params);
    const request = validate(approveKoreksiValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await koreksiAbsensiService.approveKoreksi(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Correction request approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a correction request
 */
const rejectKoreksi = async (req, res, next) => {
  try {
    const { id } = validate(koreksiIdValidation, req.params);
    const request = validate(rejectKoreksiValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await koreksiAbsensiService.rejectKoreksi(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Correction request rejected",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a correction request
 */
const cancelKoreksi = async (req, res, next) => {
  try {
    const { id } = validate(koreksiIdValidation, req.params);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await koreksiAbsensiService.cancelKoreksi(id, auditInfo);

    res.status(200).json({
      success: true,
      message: "Correction request cancelled",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a manual attendance request (forgot to clock in)
 */
const createAbsensiManual = async (req, res, next) => {
  try {
    const request = validate(createAbsensiManualValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      cabangId: req.user.cabangId,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await koreksiAbsensiService.createAbsensiManual(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Pengajuan absensi manual berhasil dikirim. Menunggu persetujuan.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKoreksi,
  getKoreksi,
  getKoreksiById,
  approveKoreksi,
  rejectKoreksi,
  cancelKoreksi,
  createAbsensiManual,
};
