import * as z from "zod";

/**
 * Schema for creating a new product-supplier relationship with branch support
 */
export const createProdukSupplierSchema = z.object({
  produkMasterId: z.string().min(1, "ID produk master diperlukan"),
  supplierId: z.string().min(1, "ID supplier diperlukan"),
  isPrimary: z.boolean().default(false),
  hargaBeli: z
    .number()
    .positive("Harga beli harus lebih dari 0")
    .refine((val) => !isNaN(val), {
      message: "Harga beli harus berupa angka",
    }),
  minPembelian: z
    .number()
    .int("Minimum pembelian harus berupa bilangan bulat")
    .min(1, "Minimum pembelian harus minimal 1")
    .nullish(),
  leadTime: z
    .number()
    .int("Lead time harus berupa bilangan bulat")
    .min(0, "Lead time tidak boleh negatif")
    .nullish(),
  kodeProdukSupplier: z.string().max(100).nullish(),
  cabangId: z
    .string()
    .nullish()
    .transform((val) => (val === "" ? null : val)),
  status: z.enum(["aktif", "tidak_aktif"]).default("aktif"),
});

/**
 * Schema for updating an existing product-supplier relationship
 */
export const updateProdukSupplierSchema = z.object({
  isPrimary: z.boolean().optional(),
  hargaBeli: z.number().positive("Harga beli harus lebih dari 0").optional(),
  minPembelian: z
    .number()
    .int("Minimum pembelian harus berupa bilangan bulat")
    .min(1, "Minimum pembelian harus minimal 1")
    .nullish()
    .optional(),
  leadTime: z
    .number()
    .int("Lead time harus berupa bilangan bulat")
    .min(0, "Lead time tidak boleh negatif")
    .nullish()
    .optional(),
  kodeProdukSupplier: z.string().max(100).nullish().optional(),
  cabangId: z
    .string()
    .nullish()
    .transform((val) => (val === "" ? null : val))
    .optional(),
  status: z.enum(["aktif", "tidak_aktif"]).optional(),
});
