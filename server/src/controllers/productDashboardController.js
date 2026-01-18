const ProductDashboardService = require("../services/productDashboardService");

/**
 * Controller untuk mengelola dashboard produk
 */
class ProductDashboardController {
  /**
   * Mendapatkan data dashboard produk
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProductDashboardData(req, res, next) {
    try {
      const { cabangId } = req.query;
      const result = await ProductDashboardService.getProductDashboardData(
        cabangId
      );
      res.status(200).json({
        success: true,
        message: "Product dashboard data retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan data produk terlaris
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTopProducts(req, res, next) {
    try {
      const { limit = 5, cabangId } = req.query;
      const result = await ProductDashboardService.getTopProducts(
        parseInt(limit),
        cabangId
      );
      res.status(200).json({
        success: true,
        message: "Top products retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan produk master baru yang ditambahkan oleh super admin
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getNewMasterProducts(req, res, next) {
    try {
      const { limit = 5 } = req.query;
      const result = await ProductDashboardService.getNewMasterProducts(
        parseInt(limit)
      );
      res.status(200).json({
        success: true,
        message: "New master products retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan produk baru yang ditambahkan di cabang
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getNewBranchProducts(req, res, next) {
    try {
      const { limit = 5, cabangId } = req.query;
      const result = await ProductDashboardService.getNewBranchProducts(
        cabangId,
        parseInt(limit)
      );
      res.status(200).json({
        success: true,
        message: "New branch products retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan nilai inventori
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getInventoryValue(req, res, next) {
    try {
      const { cabangId } = req.query;
      const result = await ProductDashboardService.getInventoryValue(cabangId);
      res.status(200).json({
        success: true,
        message: "Inventory value retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan distribusi produk berdasarkan kategori
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProductDistribution(req, res, next) {
    try {
      const { cabangId } = req.query;
      const result = await ProductDashboardService.getProductDistribution(
        cabangId
      );
      res.status(200).json({
        success: true,
        message: "Product distribution retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan data warning untuk produk
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProductWarningData(req, res, next) {
    try {
      const { cabangId } = req.query;
      const result = await ProductDashboardService.getProductWarningData(
        cabangId
      );
      res.status(200).json({
        success: true,
        message: "Product warning data retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidate cache dashboard produk
   * Biasanya dipanggil setelah ada perubahan data produk
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async invalidateProductDashboardCache(req, res, next) {
    try {
      const { cabangId } = req.body;
      await ProductDashboardService.invalidateProductDashboardCache(cabangId);
      res.status(200).json({
        success: true,
        message: "Product dashboard cache invalidated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductDashboardController;
