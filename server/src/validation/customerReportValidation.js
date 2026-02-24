const { z } = require("zod");

/**
 * Validation schemas for customer report endpoints
 */

const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Customer summary validation
const customerSummarySchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  segmen: z.enum(["Retail", "Grosir", "VIP"]).optional(),
});

// Top customers validation
const topCustomersSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
});

// Loyalty report validation
const loyaltyReportSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

// Customer acquisition validation
const customerAcquisitionSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

module.exports = {
  customerSummarySchema,
  topCustomersSchema,
  loyaltyReportSchema,
  customerAcquisitionSchema,
};
