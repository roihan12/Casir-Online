const promoReportService = require("../services/promoReportService");
const {
  promoSummarySchema,
  promoEffectivenessSchema,
  discountBreakdownSchema,
} = require("../validation/promoReportValidation");

/**
 * Controller for promo & discount report endpoints
 */
class PromoReportController {
  /**
   * Get promo summary metrics
   * GET /api/reports/promo/summary
   */
  async getPromoSummary(req, res, next) {
    try {
      const validatedData = promoSummarySchema.parse(req.query);

      const result = await promoReportService.getPromoSummary(validatedData);

      res.status(200).json({
        success: true,
        message: "Promo summary retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get promo effectiveness metrics
   * GET /api/reports/promo/effectiveness/:promoId
   */
  async getPromoEffectiveness(req, res, next) {
    try {
      const validatedData = promoEffectivenessSchema.parse({
        ...req.query,
        promoId: req.params.promoId,
      });

      const result = await promoReportService.getPromoEffectiveness(
        validatedData.promoId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Promo effectiveness retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get discount breakdown
   * GET /api/reports/promo/discount-breakdown
   */
  async getDiscountBreakdown(req, res, next) {
    try {
      const validatedData = discountBreakdownSchema.parse(req.query);

      const result = await promoReportService.getDiscountBreakdown(
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Discount breakdown retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromoReportController();
