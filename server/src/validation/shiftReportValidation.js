const { z } = require("zod");

/**
 * Validation schemas for shift report endpoints
 */

// Common filters
const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Shift summary validation
const shiftSummarySchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(["dibuka", "ditutup"]).optional(),
});

// Shift detail validation
const shiftDetailSchema = z.object({
  shiftId: z.string().optional(),
});

// Cash report validation
const cashReportSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

// Staff performance validation
const staffPerformanceSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

module.exports = {
  shiftSummarySchema,
  shiftDetailSchema,
  cashReportSchema,
  staffPerformanceSchema,
};
