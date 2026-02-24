const { z } = require("zod");

/**
 * Validation schemas for transaction report endpoints
 */

const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Transaction detail validation
const transactionDetailSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
  status: z.enum(["LUNAS", "BELUM_LUNAS", "VOID", "REFUND"]).optional(),
  metodePembayaran: z.enum(["tunai", "kartu_debit", "kartu_kredit", "qris", "transfer"]).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 50)),
});

// Transaction summary validation
const transactionSummarySchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

// Audit trail validation
const auditTrailSchema = dateRangeSchema.extend({
  cabangId: z.string().optional(),
});

module.exports = {
  transactionDetailSchema,
  transactionSummarySchema,
  auditTrailSchema,
};
