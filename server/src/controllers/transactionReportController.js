const transactionReportService = require("../services/transactionReportService");
const {
  transactionDetailSchema,
  transactionSummarySchema,
  auditTrailSchema,
} = require("../validation/transactionReportValidation");

/**
 * Controller for transaction report endpoints
 */
class TransactionReportController {
  /**
   * Get detailed transaction list with pagination
   * GET /api/reports/transactions/detail
   */
  async getTransactionDetail(req, res, next) {
    try {
      const validatedData = transactionDetailSchema.parse(req.query);

      const result = await transactionReportService.getTransactionDetail(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Transaction detail retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction summary by status
   * GET /api/reports/transactions/summary
   */
  async getTransactionSummary(req, res, next) {
    try {
      const validatedData = transactionSummarySchema.parse(req.query);

      const result = await transactionReportService.getTransactionSummary(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Transaction summary retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit trail for voided/refunded transactions
   * GET /api/reports/transactions/audit
   */
  async getAuditTrail(req, res, next) {
    try {
      const validatedData = auditTrailSchema.parse(req.query);

      const result = await transactionReportService.getAuditTrail(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Audit trail retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionReportController();
