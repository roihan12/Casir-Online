const { z } = require("zod");

/**
 * Validation schemas for promo report endpoints
 */

const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Promo summary validation
const promoSummarySchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  promoId: z.string().optional(),
});

// Promo effectiveness validation
const promoEffectivenessSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  promoId: z.string().optional(),
});

// Discount breakdown validation
const discountBreakdownSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

module.exports = {
  promoSummarySchema,
  promoEffectivenessSchema,
  discountBreakdownSchema,
};
