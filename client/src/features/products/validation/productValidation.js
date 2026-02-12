import { z } from "zod";

/**
 * Validation schemas for Product feature
 */

// Filter schema for listing products
export const ProdukFilterSchema = z.object({
  search: z.string().optional(),
  produkMasterId: z.string().optional(),
  cabangId: z.string().optional(),
  status: z.string().optional(),
  minHarga: z.number().optional(),
  maxHarga: z.number().optional(),
  minStok: z.number().optional(),
  maxStok: z.number().optional(),
  kategoriId: z.string().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  updatedAfter: z.string().optional(),
  updatedBefore: z.string().optional(),
  sortBy: z.string().optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// Create product schema
export const ProdukCreateSchema = z.object({
  produkMasterId: z.string(),
  cabangId: z.string(),
  hargaBeli: z.number().nonnegative(),
  hargaJual: z.number().nonnegative(),
  hargaGrosir: z.number().nonnegative().optional(),
  stok: z.number().nonnegative().optional().default(0),
  minStok: z.number().nonnegative().optional(),
  maxStok: z.number().nonnegative().optional(),
  status: z.enum(["tersedia", "tidak_tersedia"]).optional().default("tersedia"),
});

// Update product schema
export const ProdukUpdateSchema = z.object({
  hargaBeli: z.number().nonnegative(),
  hargaJual: z.number().nonnegative(),
  hargaGrosir: z.number().nonnegative().optional(),
  minStok: z.number().nonnegative().optional(),
  maxStok: z.number().nonnegative().optional(),
  status: z.enum(["tersedia", "tidak_tersedia"]),
  alasanPerubahan: z.string().optional(),
  dokumenReferensi: z.string().optional(),
  supplierId: z.string().optional(),
});

// Stock update schema
export const StokUpdateSchema = z.object({
  quantity: z.number(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  batchNumber: z.string().optional(),
  expiredDate: z.date().optional(),
  keterangan: z.string().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

export default {
  ProdukFilterSchema,
  ProdukCreateSchema,
  ProdukUpdateSchema,
  StokUpdateSchema,
  PaginationSchema,
};
