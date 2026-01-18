const KasirService = require('../services/kasirService');
const { validationResult } = require('express-validator');
const createError = require('http-errors');

class KasirController {
  /**
   * Get kasir dashboard data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDashboard(req, res, next) {
    try {
      const { cabangId } = req.query;
      const user = req.user; // User object from auth middleware

      const dashboardData = await KasirService.getKasirDashboardData(
        user,
        cabangId
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active shift
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getActiveShift(req, res, next) {
    try {
      const { cabangId } = req.query;
      const userId = req.user.id;

      if (!cabangId) {
        throw createError(400, "cabangId is required");
      }

      const activeShift = await KasirService.getActiveShift(userId, cabangId);

      res.status(200).json({
        success: true,
        data: activeShift,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Open a new shift
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async openShift(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cabangId, kasAwal } = req.body;
      const userId = req.user.id;

      if (!cabangId || kasAwal === undefined) {
        throw createError(400, "cabangId and kasAwal are required");
      }

      const shift = await KasirService.openShift(
        userId,
        cabangId,
        parseFloat(kasAwal)
      );

      res.status(201).json({
        success: true,
        message: "Shift berhasil dibuka",
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close an active shift
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async closeShift(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cabangId, kasAkhir, keterangan } = req.body;
      const userId = req.user.id;

      if (!cabangId || kasAkhir === undefined) {
        throw createError(400, "cabangId and kasAkhir are required");
      }

      const shift = await KasirService.closeShift(
        userId,
        cabangId,
        parseFloat(kasAkhir),
        keterangan
      );

      res.status(200).json({
        success: true,
        message: "Shift berhasil ditutup",
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get shifts history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getShiftsHistory(req, res, next) {
    try {
      const { cabangId, page, limit } = req.query;
      const userId = req.user.id;

      if (!cabangId) {
        throw createError(400, "cabangId is required");
      }

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;

      const shiftsHistory = await KasirService.getShiftsHistory(
        userId,
        cabangId,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: shiftsHistory,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async searchProducts(req, res, next) {
    try {
      const { query, cabangId, limit } = req.query;

      if (!query || !cabangId) {
        throw createError(400, "query and cabangId are required");
      }

      const limitNum = parseInt(limit) || 10;

      const products = await KasirService.searchProducts(
        query,
        cabangId,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by barcode or SKU
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProductByCode(req, res, next) {
    try {
      const { code } = req.params;
      const { cabangId } = req.query;

      if (!code || !cabangId) {
        throw createError(400, "code and cabangId are required");
      }

      const product = await KasirService.getProductByCode(code, cabangId);

      if (!product) {
        throw createError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search customers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async searchCustomers(req, res, next) {
    try {
      const { query, cabangId, limit } = req.query;

      if (!query || !cabangId) {
        throw createError(400, "query and cabangId are required");
      }

      const limitNum = parseInt(limit) || 10;

      const customers = await KasirService.searchCustomers(
        query,
        cabangId,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new transaction
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createTransaction(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const transactionData = {
        ...req.body,
        userId,
      };

      // Validate required fields
      const requiredFields = [
        "cabangId",
        "shiftId",
        "items",
        "subtotal",
        "total",
        "metodePembayaran",
        "jumlahBayar",
      ];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          throw createError(400, `${field} is required`);
        }
      }

      // Validate items array
      if (
        !Array.isArray(transactionData.items) ||
        transactionData.items.length === 0
      ) {
        throw createError(400, "items must be a non-empty array");
      }

      const transaction = await KasirService.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        message: "Transaksi berhasil dibuat",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTransactionDetails(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError(400, "Transaction ID is required");
      }

      try {
        const transaction = await KasirService.getTransactionDetails(id);

        res.status(200).json({
          success: true,
          data: transaction,
        });
      } catch (err) {
        if (err.message === "Transaction not found") {
          throw createError(404, "Transaction not found");
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent transactions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getRecentTransactions(req, res, next) {
    try {
      const { cabangId, limit } = req.query;
      const userId = req.user.id;

      if (!cabangId) {
        throw createError(400, "cabangId is required");
      }

      const limitNum = parseInt(limit) || 10;

      const transactions = await KasirService.getRecentTransactions(
        userId,
        cabangId,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Print receipt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async printReceipt(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError(400, "Transaction ID is required");
      }

      try {
        // Use the service to get formatted receipt data
        const receiptData = await KasirService.printReceipt(id);

        res.status(200).json({
          success: true,
          data: receiptData,
        });
      } catch (err) {
        if (err.message === "Transaction not found") {
          throw createError(404, "Transaction not found");
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receipt configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getReceiptConfig(req, res, next) {
    try {
      const { cabangId } = req.query;

      if (!cabangId) {
        throw createError(400, "cabangId is required");
      }

      const config = await KasirService.getReceiptConfig(cabangId);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get daily summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDailySummary(req, res, next) {
    try {
      const { cabangId, date } = req.query;

      if (!cabangId) {
        throw createError(400, "cabangId is required");
      }

      const summary = await KasirService.getDailySummary(cabangId, date);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = KasirController;