const { z } = require("zod");

const formatEnum = z.enum(["excel", "pdf", "csv"]);

const exportSalesReportSchema = z.object({
  format: formatEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  cabangId: z.string().optional(),
});

const exportFinancialReportSchema = z.object({
  format: formatEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  cabangId: z.string().optional(),
});

const exportInventoryReportSchema = z.object({
  format: formatEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  cabangId: z.string().optional(),
});

const exportBranchReportSchema = z.object({
  format: formatEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

module.exports = {
  exportSalesReportSchema,
  exportFinancialReportSchema,
  exportInventoryReportSchema,
  exportBranchReportSchema,
};
