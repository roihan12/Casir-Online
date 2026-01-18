const inventoryBatchService = require("../services/inventoryBatchService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createProductBatchValidation,
  getExpiringStockValidation,
  getMinimumStockValidation,
  updateStockAlertSettingsValidation,
} = require("../validation/inventoryBatchValidation");

// Controller untuk menambahkan stok dengan batch number dan expired date
const addProductBatch = async (req, res, next) => {
  try {
    const request = validate(createProductBatchValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await inventoryBatchService.addProductBatch(request, {
      userId,
      ipAddress,
    });

    res.status(201).json({
      status: true,
      message: "Batch produk berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan produk dengan stok yang hampir kadaluarsa
const getExpiringStock = async (req, res, next) => {
  try {
    const filters = validate(getExpiringStockValidation, {
      cabangId: req.params.cabangId,
      daysThreshold: parseInt(req.query.daysThreshold) || 30,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await inventoryBatchService.getExpiringStock(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar stok yang akan kadaluarsa",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan produk dengan stok di bawah minimum
const getMinimumStock = async (req, res, next) => {
  try {
    const filters = validate(getMinimumStockValidation, {
      cabangId: req.params.cabangId,
      kategoriId: req.query.kategoriId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await inventoryBatchService.getMinimumStock(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar stok di bawah minimum",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk update pengaturan notifikasi stok
const updateStockAlertSettings = async (req, res, next) => {
  try {
    const request = validate(updateStockAlertSettingsValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await inventoryBatchService.updateStockAlertSettings(
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Pengaturan notifikasi stok berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProductBatch,
  getExpiringStock,
  getMinimumStock,
  updateStockAlertSettings,
};
