const customerReportService = require("../services/customerReportService");
const {
  customerSummarySchema,
  topCustomersSchema,
  loyaltyReportSchema,
  customerAcquisitionSchema,
} = require("../validation/customerReportValidation");

/**
 * Controller for customer & loyalty report endpoints
 */
class CustomerReportController {
  /**
   * Get customer summary metrics
   * GET /api/reports/customer/summary
   */
  async getCustomerSummary(req, res, next) {
    try {
      const validatedData = customerSummarySchema.parse(req.query);

      const result = await customerReportService.getCustomerSummary(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Customer summary retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top customers by spending
   * GET /api/reports/customer/top
   */
  async getTopCustomers(req, res, next) {
    try {
      const validatedData = topCustomersSchema.parse(req.query);

      const result = await customerReportService.getTopCustomers(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Top customers retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get loyalty program metrics
   * GET /api/reports/customer/loyalty
   */
  async getLoyaltyReport(req, res, next) {
    try {
      const validatedData = loyaltyReportSchema.parse(req.query);

      const result = await customerReportService.getLoyaltyReport(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Loyalty report retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer acquisition trend
   * GET /api/reports/customer/acquisition
   */
  async getCustomerAcquisition(req, res, next) {
    try {
      const validatedData = customerAcquisitionSchema.parse(req.query);

      const result = await customerReportService.getCustomerAcquisition(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Customer acquisition data retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerReportController();
