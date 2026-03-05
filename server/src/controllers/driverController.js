const driverService = require("../services/driverService");
const { validate } = require("../validation/validation");
const {
  createDriverValidation,
  updateDriverValidation,
} = require("../validation/driverValidation");

const getDrivers = async (req, res, next) => {
  try {
    const cabangId = req.user?.cabangId || req.user?.cabang?.[0]?.cabangId || req.user?.cabang?.[0]?.id || req.query.cabangId;
    if (!cabangId) {
      return res.status(400).json({ status: false, errors: "Cabang ID required" });
    }

    const result = await driverService.getDrivers(cabangId, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });

    res.status(200).json({
      status: true,
      message: "Success get drivers",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableDrivers = async (req, res, next) => {
  try {
    const cabangId = req.query.cabangId;
    if (!cabangId) {
      return res.status(400).json({ status: false, errors: "Cabang ID required" });
    }

    const result = await driverService.getAvailableDrivers(cabangId);

    res.status(200).json({
      status: true,
      message: "Success get available drivers",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const cabangId = req.user?.cabangId || req.user?.cabang?.[0]?.cabangId || req.user?.cabang?.[0]?.id;
    if (!cabangId) {
      return res.status(400).json({ status: false, errors: "Cabang ID required" });
    }

    const data = validate(createDriverValidation, req.body);
    const result = await driverService.createDriver(cabangId, data);

    res.status(201).json({
      status: true,
      message: "Driver berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const data = validate(updateDriverValidation, req.body);
    const result = await driverService.updateDriver(req.params.id, data);

    res.status(200).json({
      status: true,
      message: "Driver berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    await driverService.deleteDriver(req.params.id);

    res.status(200).json({
      status: true,
      message: "Driver berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

const toggleDriverStatus = async (req, res, next) => {
  try {
    const result = await driverService.toggleDriverStatus(req.params.id);

    res.status(200).json({
      status: true,
      message: `Driver status diubah ke ${result.status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableUsers = async (req, res, next) => {
  try {
    const cabangId = req.user?.cabangId || req.user?.cabang?.[0]?.cabangId || req.query.cabangId;
    const result = await driverService.getAvailableUsers(cabangId);

    res.status(200).json({
      status: true,
      message: "Success get available users",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getAvailableDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
  getAvailableUsers,
};
