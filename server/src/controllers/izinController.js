const izinService = require("../services/izinService");
const { validate } = require("../validation/validation");
const {
  createIzinValidation,
  createCutiValidation,
  getIzinValidation,
  approveIzinValidation,
  rejectIzinValidation,
  izinIdValidation,
} = require("../validation/izinValidation");

/**
 * Create izin request (sakit/keperluan)
 */
const createIzin = async (req, res, next) => {
  try {
    const request = validate(createIzinValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };


    const result = await izinService.createIzin(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Pengajuan izin berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create cuti request (tahunan/melahirkan/bersama/khusus)
 */
const createCuti = async (req, res, next) => {
  try {
    const request = validate(createCutiValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await izinService.createCuti(request, auditInfo);

    res.status(201).json({
      success: true,
      message: "Pengajuan cuti berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get izin/cuti list (my requests or all for admin)
 */
const getIzin = async (req, res, next) => {
  try {
    const filters = validate(getIzinValidation, {
      userId: req.query.userId,
      cabangId: req.query.cabangId,
      status: req.query.status,
      tipeIzin: req.query.tipeIzin,
      tanggalMulai: req.query.tanggalMulai,
      tanggalSelesai: req.query.tanggalSelesai,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await izinService.getIzin(filters);

    res.status(200).json({
      success: true,
      message: "Izin/cuti list retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get izin/cuti by ID
 */
const getIzinById = async (req, res, next) => {
  try {
    const { id } = validate(izinIdValidation, req.params);
    const result = await izinService.getIzinById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my izin/cuti requests (authenticated user)
 */
const getMyIzin = async (req, res, next) => {
  try {
    const filters = validate(getIzinValidation, {
      userId: req.user.id,
      status: req.query.status,
      tipeIzin: req.query.tipeIzin,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await izinService.getIzin(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel own izin/cuti
 */
const cancelIzin = async (req, res, next) => {
  try {
    const { id } = validate(izinIdValidation, req.params);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await izinService.cancelIzin(id, auditInfo);

    res.status(200).json({
      success: true,
      message: "Pengajuan berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending requests for approval
 */
const getPendingIzin = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await izinService.getPendingIzin(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve izin/cuti
 */
const approveIzin = async (req, res, next) => {
  try {
    const { id } = validate(izinIdValidation, req.params);
    const request = validate(approveIzinValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await izinService.approveIzin(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Pengajuan berhasil disetujui",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject izin/cuti
 */
const rejectIzin = async (req, res, next) => {
  try {
    const { id } = validate(izinIdValidation, req.params);
    const request = validate(rejectIzinValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await izinService.rejectIzin(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Pengajuan berhasil ditolak",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIzin,
  createCuti,
  getIzin,
  getIzinById,
  getMyIzin,
  cancelIzin,
  getPendingIzin,
  approveIzin,
  rejectIzin,
};
