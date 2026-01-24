import { z } from "zod";

export const produkMasterSchema = z.object({
  namaProduk: z.string().min(1, "Nama produk wajib diisi").max(100, "Nama produk maksimal 100 karakter"),
  sku: z.string().min(1, "SKU wajib diisi").max(50, "SKU maksimal 50 karakter"),
  barcode: z.string().max(50, "Barcode maksimal 50 karakter").optional().nullable().or(z.literal("")),
  deskripsi: z.string().optional().nullable().or(z.literal("")),
  kategoriId: z.string().min(1, "Kategori wajib dipilih"),
  brand: z.string().max(100, "Brand maksimal 100 karakter").optional().nullable().or(z.literal("")),
  satuan: z.string().max(50, "Satuan maksimal 50 karakter").optional().nullable().or(z.literal("")),
  berat: z.coerce.number().optional().nullable(),
  dimensiP: z.coerce.number().optional().nullable(),
  dimensiL: z.coerce.number().optional().nullable(),
  dimensiT: z.coerce.number().optional().nullable(),
  isManagedStock: z.boolean().default(false),
  hasExpired: z.boolean().default(false),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
});

export default produkMasterSchema;
