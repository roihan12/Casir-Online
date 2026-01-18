const inventoryService = require("../services/inventoryService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createStockAdjustmentValidation,
  getInventoryMovementsValidation,
  updateProductPriceValidation,
  getPriceHistoryValidation,
  batchInitialStockEntryValidation,
  stockOpnameValidation,
} = require("../validation/inventoryValidation");

// Controller untuk membuat penyesuaian stok (adjustment)
const createStockAdjustment = async (req, res, next) => {
  try {
    const request = validate(createStockAdjustmentValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await inventoryService.createStockAdjustment(request, {
      userId,
      ipAddress,
    });

    res.status(201).json({
      status: true,
      message: "Stock adjustment created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan riwayat pergerakan stok
const getInventoryMovements = async (req, res, next) => {
  try {
    const filters = validate(getInventoryMovementsValidation, {
      produkId: req.query.produkId,
      cabangId: req.query.cabangId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      referenceType: req.query.referenceType,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await inventoryService.getInventoryMovements(filters);

    res.status(200).json({
      status: true,
      message: "Success get inventory movements",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mengexport data pergerakan stok ke CSV
const exportInventoryMovements = async (req, res, next) => {
  try {
    const filters = {
      produkId: req.query.produkId,
      cabangId: req.query.cabangId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      referenceType: req.query.referenceType,
      type: req.query.type,
    };

    // Validasi minimal cabangId harus ada
    if (!filters.cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await inventoryService.exportInventoryMovements(filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-movements-${new Date().toISOString().split('T')[0]}.csv`);
    
    // Send the CSV data
    res.send(result);
  } catch (error) {
    next(error);
  }
};

// Controller untuk generate laporan pergerakan stok dalam berbagai format (PDF, Excel, CSV)
const generateMovementReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId,
      produkId: req.query.produkId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      referenceType: req.query.referenceType,
      type: req.query.type,
      format: req.query.format || 'detailed', // 'detailed', 'summary', 'batch'
      outputType: req.query.outputType || 'pdf', // 'pdf', 'excel', 'csv'
    };

    // Validasi minimal cabangId harus ada
    if (!filters.cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    // Date range validation
    if (!filters.startDate || !filters.endDate) {
      throw new ResponseError(400, "startDate and endDate are required");
    }

    // Generate the report
    const result = await inventoryService.generateMovementReport(filters);
    
    // Set appropriate headers based on outputType
    let contentType;
    let filename;
    
    switch (filters.outputType) {
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `inventory-movement-${filters.format}-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'csv':
        contentType = 'text/csv';
        filename = `inventory-movement-${filters.format}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'pdf':
      default:
        contentType = 'application/pdf';
        filename = `inventory-movement-${filters.format}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send the report data
    res.send(result);
  } catch (error) {
    next(error);
  }
};

// Controller untuk entry stok awal batch
const batchInitialStockEntry = async (req, res, next) => {
  try {
    const request = validate(batchInitialStockEntryValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await inventoryService.batchInitialStockEntry(request, {
      userId,
      ipAddress,
    });

    res.status(201).json({
      status: true,
      message: "Initial stock entry completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk stock opname
const stockOpname = async (req, res, next) => {
  try {
    const request = validate(stockOpnameValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await inventoryService.stockOpname(request, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Stock opname completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk update harga produk
const updateProductPrice = async (req, res, next) => {
  try {
    const request = validate(updateProductPriceValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap

    const result = await inventoryService.updateProductPrice(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Product price updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan riwayat perubahan harga
const getPriceHistory = async (req, res, next) => {
  try {
    const filters = validate(getPriceHistoryValidation, {
      produkId: req.query.produkId,
      cabangId: req.query.cabangId,
      tipeHarga: req.query.tipeHarga,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await inventoryService.getPriceHistory(filters);

    res.status(200).json({
      status: true,
      message: "Success get price history",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan laporan status stok saat ini
const getCurrentStockReport = async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.params.cabangId,
      kategoriId: req.query.kategoriId,
      search: req.query.search,
      lowStock: req.query.lowStock,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    if (!filters.cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await inventoryService.getCurrentStockReport(filters);

    res.status(200).json({
      status: true,
      message: "Success get current stock report",
      data: result.data,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan data pergerakan stok
const getStockMovementData = async (req, res, next) => {
  try {
    const filters = {
      produkId: req.query.produkId,
      cabangId: req.query.cabangId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      referenceType: req.query.referenceType,
      type: req.query.type,
    };

    const result = await inventoryService.getStockMovementData(filters);

    res.status(200).json({
      status: true,
      message: "Success get stock movement data",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockMovementData,
  createStockAdjustment,
  getInventoryMovements,
  exportInventoryMovements,
  generateMovementReport,
  batchInitialStockEntry,
  stockOpname,
  updateProductPrice,
  getPriceHistory,
  getCurrentStockReport,
};
