const kuotaCutiService = require("../services/kuotaCutiService");
const { validate } = require("../validation/validation");
const {
  getKuotaCutiValidation,
  userIdValidation,
  generateKuotaValidation,
  updateKuotaValidation,
  kuotaIdValidation,
} = require("../validation/kuotaCutiValidation");

const getKuotaCutiByUser = async (req, res, next) => {
  try {
    const { userId } = validate(userIdValidation, req.params);
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : undefined;

    const result = await kuotaCutiService.getKuotaCutiByUser(userId, tahun);

    res.status(200).json({
      success: true,
      message: "Leave quota retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllKuotaCuti = async (req, res, next) => {
  try {
    const filters = validate(getKuotaCutiValidation, {
      tahun: req.query.tahun ? parseInt(req.query.tahun) : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    const result = await kuotaCutiService.getAllKuotaCuti(filters);

    res.status(200).json({
      success: true,
      message: "Leave quotas retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const generateKuotaTahunan = async (req, res, next) => {
  try {
    const request = validate(generateKuotaValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await kuotaCutiService.generateKuotaTahunan(request, auditInfo);

    res.status(201).json({
      success: true,
      message: `Leave quota generated for year ${result.tahun}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateKuotaCuti = async (req, res, next) => {
  try {
    const { id } = validate(kuotaIdValidation, req.params);
    const request = validate(updateKuotaValidation, req.body);

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const result = await kuotaCutiService.updateKuotaCuti(id, request, auditInfo);

    res.status(200).json({
      success: true,
      message: "Leave quota updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKuotaCutiByUser,
  getAllKuotaCuti,
  generateKuotaTahunan,
  updateKuotaCuti,
};
