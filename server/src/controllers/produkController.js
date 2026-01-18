const produkService = require("../services/produkService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createProdukValidation,
  updateProdukValidation,
  updateStokValidation,
  bulkAddProductsValidation
} = require("../validation/produkValidation");

// Get all products with pagination and filtering
// Get all products with pagination and filtering
const getAllProduk = async (req, res, next) => {
  try {
    const search = req.query.search;
    const produkMasterId = req.query.produkMasterId;
    const cabangId = req.query.cabangId;
    const status = req.query.status;
    const minHarga = req.query.minHarga;
    const maxHarga = req.query.maxHarga;
    const minStok = req.query.minStok;
    const maxStok = req.query.maxStok;
    const kategoriId = req.query.kategoriId;
    const createdAfter = req.query.createdAfter;
    const createdBefore = req.query.createdBefore;
    const updatedAfter = req.query.updatedAfter;
    const updatedBefore = req.query.updatedBefore;
    const sortBy = req.query.sortBy || "updatedAt";
    const sortOrder = req.query.sortOrder || "desc";
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await produkService.getAllProduk({
      search,
      produkMasterId,
      cabangId,
      status,
      minHarga,
      maxHarga,
      minStok,
      maxStok,
      kategoriId,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.status(200).json({
      status: true,
      message: "Success get all products",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get a product by ID
const getProdukById = async (req, res, next) => {
  try {
    const produkId = req.params.id;

    const result = await produkService.getProdukById(produkId);

    if (!result) {
      throw new ResponseError(404, "Product not found");
    }

    res.status(200).json({
      status: true,
      message: "Success get product detail",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by produkMasterId and cabangId
const getProdukByMasterAndCabang = async (req, res, next) => {
  try {
    const { produkMasterId, cabangId } = req.query;

    if (!produkMasterId || !cabangId) {
      throw new ResponseError(400, "produkMasterId and cabangId are required");
    }

    const result = await produkService.getProdukByMasterAndCabang(
      produkMasterId,
      cabangId
    );

    res.status(200).json({
      status: true,
      message: "Success get product",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new product
const createProduk = async (req, res, next) => {
  try {
    const request = validate(createProdukValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap

    const result = await produkService.createProduk(
      {
        ...request,
        userId,
        userName
      },
      {
        userId,
        userName,
        ipAddress,
      }
    );

    res.status(201).json({
      status: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduk = async (req, res, next) => {
  try {
    const produkId = req.params.id;
    const request = validate(updateProdukValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap

    const result = await produkService.updateProduk(
      produkId,
      {
        ...request,
        userId,
        userName
      },
      {
        userId,
        userName,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update stock
const updateStok = async (req, res, next) => {
  try {
    const produkId = req.params.id;
    const request = validate(updateStokValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap

    const result = await produkService.updateStok(
      produkId,
      {
        ...request,
        userId, // Add userId to the data for inventory movement
      },
      {
        userId,
        userName,
        ipAddress,
      }
    );

    res.status(200).json({
      status: true,
      message: "Stock updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory movement history
const getInventoryMovements = async (req, res, next) => {
  try {
    const produkId = req.params.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await produkService.getInventoryMovements(produkId, {
      page,
      limit,
    });

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

// Get price history
const getPriceHistory = async (req, res, next) => {
  try {
    const produkId = req.params.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await produkService.getPriceHistory(produkId, {
      page,
      limit,
    });

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

// Get products with low stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await produkService.getLowStockProducts(cabangId, {
      page,
      limit,
    });

    res.status(200).json({
      status: true,
      message: "Success get low stock products",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Mendapatkan rekomendasi produk untuk cabang
 */
const getProductRecommendations = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const { limit = 20, kategoriId = null, search = null, page=1 } = req.query;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const result = await produkService.getProductRecommendationsForBranch(
      cabangId, 
      parseInt(limit), 
      kategoriId, 
      search,
      parseInt(page)
    );

    res.status(200).json({
      status: true,
      message: "Success get product recommendations",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan template produk
 */
const getProductTemplates = async (req, res, next) => {
  try {
    const kategoriId = req.query.kategoriId;

    const result = await produkService.getProductTemplates(kategoriId);

    res.status(200).json({
      status: true,
      message: "Success get product templates",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Menambahkan produk secara massal ke cabang
 */
const bulkAddProducts = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const request = validate(bulkAddProductsValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const userName = req.user.namaLengkap;

    const result = await produkService.bulkAddProductsToBranch(
      cabangId,
      request.products, // Changed from produkMasterIds to products
      request.defaultValues || {}, // Make defaultValues optional
      {
        userId,
        userName,
        ipAddress,
        userAgent,
      }
    );

    res.status(201).json({
      status: true,
      message: result.message,
      data: {
        addedProducts: result.addedProducts,
        skippedProducts: result.skippedProducts,
        createdProducts: result.createdProducts,
        skippedProductDetails: result.skippedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};




/**
 * Search products with various parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const searchProducts = async (req, res, next) => {
  try {

   const cabangId= req.params.cabangId 
    const { 
      query, 
      kategoriId, 
      page = 1, 
      limit = 10,
      sortBy = "namaProduk",
      sortOrder = "asc"
    } = req.query;
    
    // Validate cabangId
    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "Branch ID is required"
      });
    }
    
    // Search products
    const result = await produkService.searchProducts({
      query,
      cabangId,
      kategoriId,
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    return res.status(200).json({
      status: true,
      message: "Products retrieved successfully",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by barcode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const { cabangId } = req.query;
    
    // Validate required parameters
    if (!barcode || !cabangId) {
      return res.status(400).json({
        status: false,
        message: "Barcode and Branch ID are required"
      });
    }
    
    // Get product by barcode
    const product = await produkService.getProductByBarcode(barcode, cabangId);
    
    return res.status(200).json({
      status: true,
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get frequently used products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getFrequentlyUsedProducts = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate cabangId
    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "Branch ID is required"
      });
    }
    
    // Get frequently used products with pagination
    const result = await produkService.getFrequentlyUsedProducts(
      cabangId,
      parseInt(page),
      parseInt(limit)
    );
    
    return res.status(200).json({
      status: true,
      message: "Frequently used products retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};




module.exports = {
  getAllProduk,
  getProdukById,
  getProdukByMasterAndCabang,
  createProduk,
  updateProduk,
  updateStok,
  getInventoryMovements,
  getPriceHistory,
  getLowStockProducts,
  getProductRecommendations,
  getProductTemplates,
  bulkAddProducts,
  searchProducts,
  getProductByBarcode,
  getFrequentlyUsedProducts
};
