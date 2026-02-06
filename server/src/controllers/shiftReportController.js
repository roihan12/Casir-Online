const shiftReportService = require("../services/shiftReportService");
const {
  shiftSummarySchema,
  shiftDetailSchema,
  cashReportSchema,
  staffPerformanceSchema,
} = require("../validation/shiftReportValidation");

/**
 * Controller for shift report endpoints
 */
class ShiftReportController {
  /**
   * Get shift summary metrics
   * GET /api/reports/shift/summary
   */
  async getShiftSummary(req, res, next) {
    try {
      const validatedData = shiftSummarySchema.parse(req.query);

      const result = await shiftReportService.getShiftSummary(validatedData);

      res.status(200).json({
        success: true,
        message: "Shift summary retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed shift information
   * GET /api/reports/shift/detail/:shiftId
   */
  async getShiftDetail(req, res, next) {
    try {
      const validatedData = shiftDetailSchema.parse({
        shiftId: req.params.shiftId,
      });

      const result = await shiftReportService.getShiftDetail(
        validatedData.shiftId
      );

      res.status(200).json({
        success: true,
        message: "Shift detail retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cash variance report
   * GET /api/reports/shift/cash-report
   */
  async getCashReport(req, res, next) {
    try {
      const validatedData = cashReportSchema.parse(req.query);

      const result = await shiftReportService.getCashReport(validatedData);

      res.status(200).json({
        success: true,
        message: "Cash report retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff performance comparison
   * GET /api/reports/shift/staff-performance
   */
  async getStaffPerformance(req, res, next) {
    try {
      const validatedData = staffPerformanceSchema.parse(req.query);

      const result = await shiftReportService.getStaffPerformance(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Staff performance retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShiftReportController();
