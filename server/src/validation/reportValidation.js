const { z } = require("zod");

/**
 * Validation schemas for report view endpoints
 */

// Date format validation
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format",
});

// Common filters
const baseFilterSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  cabangId: z.string().optional(),
});

// Pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
});

/**
 * SALES REPORT VALIDATION
 */

// Get sales report list
const getSalesReportSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  cabangId: z.string().optional(),
  viewType: z.enum(["daily", "weekly", "monthly"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
});

// Get sales summary
const getSalesSummarySchema = baseFilterSchema;

// Get top products
const getTopProductsSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  cabangId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Get sales by category
const getSalesByCategorySchema = baseFilterSchema;

/**
 * FINANCIAL REPORT VALIDATION
 */

// Get financial dashboard
const getFinancialDashboardSchema = baseFilterSchema;

// Get financial summary
const getFinancialSummarySchema = baseFilterSchema;

// Get financial transactions list
const getFinancialTransactionsSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  cabangId: z.string().optional(),
  jenisTransaksi: z.enum(["PENJUALAN", "PEMBELIAN"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
});

/**
 * INVENTORY REPORT VALIDATION
 */

// Get inventory dashboard
const getInventoryDashboardSchema = z.object({
  cabangId: z.string().optional(),
  includeLowStock: z.coerce.boolean().optional().default(false),
});

// Get inventory movements
const getInventoryMovementsSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  cabangId: z.string(),
  produkId: z.string().optional(),
  groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

/**
 * BRANCH REPORT VALIDATION
 */

// Get branch comparison
const getBranchComparisonSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

module.exports = {
  // Sales report
  getSalesReportSchema,
  getSalesSummarySchema,
  getTopProductsSchema,
  getSalesByCategorySchema,

  // Financial report
  getFinancialDashboardSchema,
  getFinancialSummarySchema,
  getFinancialTransactionsSchema,

  // Inventory report
  getInventoryDashboardSchema,
  getInventoryMovementsSchema,

  // Branch report
  getBranchComparisonSchema,
};
