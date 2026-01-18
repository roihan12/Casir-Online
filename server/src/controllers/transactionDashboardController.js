const TransactionDashboardService = require("../services/transactionDashboardService");
const { ResponseError } = require("../error/responseError");

/**
 * Controller untuk dashboard transaksi
 */
class TransactionDashboardController {
  /**
   * Mendapatkan data dashboard transaksi
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async getTransactionDashboardData(req, res, next) {
    try {
      const filters = {
        cabang_id: req.query.cabang_id,
        tanggal_mulai: req.query.tanggal_mulai,
        tanggal_akhir: req.query.tanggal_akhir,
      };

      const result = await TransactionDashboardService.getTransactionDashboardData(filters);

      res.status(200).json({
        status: true,
        message: "Data dashboard transaksi berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menghapus cache dashboard transaksi
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async invalidateTransactionDashboardCache(req, res, next) {
    try {
      const { cabang_id } = req.query;

      await TransactionDashboardService.invalidateTransactionDashboardCache(cabang_id);

      res.status(200).json({
        status: true,
        message: "Cache dashboard transaksi berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionDashboardController;