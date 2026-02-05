const inventoryReportService = require("../services/inventoryReportService");
const expiringProductsReportService = require("../services/expiringProductsReportService");
const { ResponseError } = require("../error/responseError");

// Controller untuk mendapatkan laporan nilai inventaris
const getInventoryValueReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      kategoriId: req.query.kategoriId,
      calculateCost: req.query.valueType !== "retail",
      includeLowStock: req.query.includeLowStock === "true",
    };

    if (!filters.cabangId) {
      throw new ResponseError(400, "cabangId diperlukan");
    }

    const result = await inventoryReportService.getInventoryValueReport(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Laporan nilai inventaris berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan laporan pergerakan inventaris
const getInventoryMovementReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.params.cabangId,
      produkId: req.query.produkId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      referenceType: req.query.referenceType,
      groupBy: req.query.groupBy || "day",
    };

    if (!filters.cabangId) {
      throw new ResponseError(400, "cabangId diperlukan");
    }

    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "startDate dan endDate diperlukan");
    }

    const result = await inventoryReportService.getInventoryMovementReport(
      filters
    );

    res.status(200).json({
      status: true,
      message: "Laporan pergerakan inventaris berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan laporan produk kadaluarsa
const getExpiringProductsReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      kategoriId: req.query.kategoriId,
      daysThreshold: req.query.daysThreshold,
      statusKadaluarsa: req.query.statusKadaluarsa,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await expiringProductsReportService.getExpiringProductsReport(filters);

    res.status(200).json({
      status: true,
      message: "Laporan produk kadaluarsa berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan ringkasan produk kadaluarsa per kategori
const getExpiringByCategory = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      daysThreshold: req.query.daysThreshold,
    };

    const result = await expiringProductsReportService.getExpiringByCategory(filters);

    res.status(200).json({
      status: true,
      message: "Ringkasan kategori produk kadaluarsa berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryValueReport,
  getInventoryMovementReport,
  getExpiringProductsReport,
  getExpiringByCategory,
};
