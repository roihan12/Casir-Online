const produkSupplierService = require("../services/produkSupplierService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createProdukSupplierSchema,
  updateProdukSupplierSchema,
} = require("../validation/produkSupplierValidation");

/**
 * Create a new product-supplier relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createProdukSupplier = async (req, res, next) => {
  try {
    const data = validate(createProdukSupplierSchema, req.body);

    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
      userName: req.user.namaLengkap,
    };

    const result = await produkSupplierService.createProdukSupplier(
      data,
      context
    );

    res.status(201).json({
      status: true,
      message: "Hubungan produk-supplier berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product-supplier relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProdukSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validate(updateProdukSupplierSchema, req.body);

    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
      userName: req.user.namaLengkap,
    };

    const result = await produkSupplierService.updateProdukSupplier(
      id,
      data,
      context
    );

    res.status(200).json({
      status: true,
      message: "Hubungan produk-supplier berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product-supplier relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteProdukSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const context = {
      userId: req.user.id,
      ipAddress: req.ip,
      userName: req.user.namaLengkap,
    };

    const result = await produkSupplierService.deleteProdukSupplier(
      id,
      context
    );

    res.status(200).json({
      status: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all supplier relationships for a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSuppliersByProduct = async (req, res, next) => {
  try {
    const { produkMasterId } = req.params;
    const { cabangId } = req.query;

    if (!produkMasterId) {
      throw new ResponseError(400, "ID produk master diperlukan");
    }

    const result = await produkSupplierService.getSuppliersByProduct(
      produkMasterId,
      cabangId || null
    );

    res.status(200).json({
      status: true,
      message: "Daftar supplier untuk produk berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all product relationships for a supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProductsBySupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = "",
      cabangId = null,
      produkMasterId = null,
      kategoriId = null,
    } = req.query;

    if (!supplierId) {
      throw new ResponseError(400, "ID supplier diperlukan");
    }

    const result = await produkSupplierService.getProductsBySupplier(
      supplierId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        cabangId,
        produkMasterId,
        kategoriId,
      }
    );

    res.status(200).json({
      status: true,
      message: "Daftar produk untuk supplier berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableProductsForSupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = "",
      cabangId = null,
      produkMasterId = null,
      kategoriId = null,
      status = "aktif",
    } = req.query;

    if (!supplierId) {
      throw new ResponseError(400, "ID supplier diperlukan");
    }

    const result = await produkSupplierService.getProductsForSupplier(
      supplierId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        cabangId,
        produkMasterId,
        kategoriId,
        status,
      }
    );

    res.status(200).json({
      status: true,
      message: "Daftar produk untuk supplier berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all branches that have access to products from a specific supplier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBranchesWithSupplierAccess = async (req, res, next) => {
  try {
    const { supplierId } = req.params;

    if (!supplierId) {
      throw new ResponseError(400, "ID supplier diperlukan");
    }

    const branches = await produkSupplierService.getBranchesWithSupplierAccess(
      supplierId
    );

    res.status(200).json({
      status: true,
      message: "Daftar cabang dengan akses ke produk supplier berhasil diambil",
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProdukSupplier,
  updateProdukSupplier,
  deleteProdukSupplier,
  getSuppliersByProduct,
  getProductsBySupplier,
  getBranchesWithSupplierAccess,
  getAvailableProductsForSupplier,
};
