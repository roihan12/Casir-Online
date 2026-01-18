const supplierService = require("../services/supplierService");

/**
 * Create a new supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with created supplier
 */
const createSupplier = async (req, res, next) => {
  try {
    const supplierData = req.body;
    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await supplierService.createSupplier(supplierData, context);

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with updated supplier
 */
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await supplierService.updateSupplier(
      id,
      updateData,
      context
    );

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Success response
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await supplierService.deleteSupplier(id, context);

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all suppliers with pagination and search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with suppliers and pagination metadata
 */
const getAllSuppliers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      cabangId = null,
      status = null,
    } = req.query;

    const result = await supplierService.getAllSuppliers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      cabang_id: cabangId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a supplier by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with supplier data
 */
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);

    return res.status(200).json({
      success: true,
      message: "Supplier retrieved successfully",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suppliers by branch with pagination and search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with suppliers and pagination metadata
 */
const getSupplierByCabang = async (req, res, next) => {
  try {
    const { cabangId } = req.params;

    const { page = 1, limit = 10, search = "", status = null } = req.query;

    const result = await supplierService.getSupplierByCabang(cabangId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Branch suppliers retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suppliers dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with supplier dashboard statistics
 */
const getSupplierDashboard = async (req, res, next) => {
  try {
    const { cabangId } = req.query;

    const result = await supplierService.getSupplierDashboardStats(
      cabangId || null
    );

    return res.status(200).json({
      success: true,
      message: "Supplier dashboard statistics retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed information about a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const getSupplierDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplierDetail = await supplierService.getSupplierDetail(id);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan detail supplier",
      data: supplierDetail,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  getSupplierByCabang,
  getSupplierDashboard,
  getSupplierDetail,
};
