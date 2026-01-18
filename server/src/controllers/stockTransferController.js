const stockTransferService = require("../services/stockTransferService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createStockTransferValidation,
  updateStockTransferValidation,
  sendStockTransferValidation,
  receiveStockTransferValidation,
  cancelStockTransferValidation,
  getStockTransfersValidation,
  submitForApprovalValidation,
  approveStockTransferValidation,
  rejectStockTransferValidation,
} = require("../validation/stockTransferValidation");

// Controller untuk mendapatkan daftar transfer stok
const getStockTransfers = async (req, res, next) => {
  try {
    const filters = validate(getStockTransfersValidation, {
      cabangAsalId: req.query.cabangAsalId,
      cabangTujuanId: req.query.cabangTujuanId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      nomorTransfer: req.query.nomorTransfer,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await stockTransferService.getStockTransfers(filters);

    res.status(200).json({
      status: true,
      message: "Success get stock transfers",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan detail transfer stok
const getStockTransferById = async (req, res, next) => {
  try {
    const transferId = req.params.id;

    const result = await stockTransferService.getStockTransferById(transferId);

    res.status(200).json({
      status: true,
      message: "Success get stock transfer detail",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat transfer stok baru
const createStockTransfer = async (req, res, next) => {
  try {



    const request = validate(createStockTransferValidation, req.body);

    console.log("ini request", request)
    // Get user information for audit log
    const userId = req.user.id;
    const namaLengkap = req.user.namaLengkap;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.createStockTransfer(request, {
      userId,
      ipAddress,
      namaLengkap,
    });

    res.status(201).json({
      status: true,
      message: "Stock transfer created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk update transfer stok
const updateStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(updateStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const namaLengkap = req.user.namaLengkap;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.updateStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
        namaLengkap
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk submit transfer stok untuk approval
const submitForApproval = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(submitForApprovalValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.submitForApproval(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer submitted for approval successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk approve transfer stok
const approveStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(approveStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.approveStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk reject transfer stok
const rejectStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(rejectStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.rejectStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mengirim transfer stok
const sendStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(sendStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.sendStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menerima transfer stok
const receiveStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(receiveStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.receiveStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer received successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membatalkan transfer stok
const cancelStockTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.id;
    const request = validate(cancelStockTransferValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await stockTransferService.cancelStockTransfer(
      transferId,
      request,
      {
        userId,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock transfer canceled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar transfer yang memerlukan approval
const getTransfersNeedingApproval = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      cabangAsalId: req.query.cabangAsalId,
      cabangTujuanId: req.query.cabangTujuanId,
      nomorTransfer: req.query.nomorTransfer,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await stockTransferService.getTransfersNeedingApproval(filters);

    res.status(200).json({
      status: true,
      message: "Success get transfers needing approval",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar transfer yang sedang pending untuk cabang
const getPendingTransfersForBranch = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await stockTransferService.getPendingTransfersForBranch(
      cabangId,
      page,
      limit
    );

    res.status(200).json({
      status: true,
      message: "Success get pending transfers",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan riwayat transfer untuk cabang
const getTransferHistoryForBranch = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await stockTransferService.getTransferHistoryForBranch(
      cabangId,
      filters
    );

    res.status(200).json({
      status: true,
      message: "Success get transfer history",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan statistik transfer stok
const getStockTransferStats = async (req, res, next) => {
  try {
    const cabangId = req.query.cabangId || null;
    
    const result = await stockTransferService.getStockTransferStats(cabangId);

    res.status(200).json({
      status: true,
      message: 'Success get stock transfer statistics',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockTransfers,
  getStockTransferById,
  getStockTransferStats,
  createStockTransfer,
  updateStockTransfer,
  submitForApproval,
  approveStockTransfer,
  rejectStockTransfer,
  sendStockTransfer,
  receiveStockTransfer,
  cancelStockTransfer,
  getPendingTransfersForBranch,
  getTransfersNeedingApproval,
  getTransferHistoryForBranch,
};
