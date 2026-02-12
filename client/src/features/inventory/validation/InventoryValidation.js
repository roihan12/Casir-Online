import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  newStock: z
    .number({ required_error: "Stok baru harus diisi" })
    .int("Stok harus berupa bilangan bulat")
    .nonnegative("Stok tidak boleh negatif"),
  batchNumber: z.string().optional(),
  expiryDate: z.union([z.string().optional(), z.date().optional()]),
  reason: z
    .string({ required_error: "Alasan penyesuaian harus diisi" })
    .min(1, "Alasan penyesuaian harus diisi"),
  notes: z.string().optional(),
});

export const stockTransferSchema = z.object({
  cabangTujuanId: z
    .string({ required_error: "Cabang tujuan harus dipilih" })
    .min(1, "Cabang tujuan harus dipilih"),
  produkItems: z
    .array(
      z.object({
        produkId: z.string().min(1, "Produk harus dipilih"),
        jumlah: z
          .number({ required_error: "Jumlah harus diisi" })
          .int("Jumlah harus berupa bilangan bulat")
          .positive("Jumlah harus lebih dari 0"),
      })
    )
    .min(1, "Minimal harus ada 1 produk yang ditransfer"),
  tanggalKirim: z.date({ required_error: "Tanggal kirim harus diisi" }),
  catatanTransfer: z.string().optional(),
});

export const stockAdjustmentFormSchema = z.object({
  cabangId: z.string({ required_error: "Cabang harus dipilih" }),
  produkId: z.string({ required_error: "Produk harus dipilih" }),
  currentStock: z.number().optional(),
  adjustmentType: z.enum(["add", "subtract", "set"], {
    required_error: "Tipe penyesuaian harus dipilih",
  }),
  quantity: z
    .number({ required_error: "Jumlah penyesuaian harus diisi" })
    .int("Jumlah harus berupa bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
  reason: z.enum(["correction", "damage", "expiry", "theft", "other"], {
    required_error: "Alasan penyesuaian harus dipilih",
  }),
  notes: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.union([z.string().optional(), z.date().optional()]),
  performedBy: z.string().optional(),
  documentReference: z.string().optional(),
});

export const stockOpnameSchema = z.object({
  cabangId: z.string({ required_error: "Cabang harus dipilih" }),
  tanggal: z.date({ required_error: "Tanggal opname harus diisi" }),
  items: z
    .array(
      z.object({
        produkId: z.string({ required_error: "Produk harus diisi" }),
        expectedStock: z.number().nonnegative(),
        actualStock: z
          .number({ required_error: "Stok aktual harus diisi" })
          .nonnegative("Stok tidak boleh negatif"),
        notes: z.string().optional(),
      })
    )
    .min(1, "Minimal harus ada 1 produk dalam opname"),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const movementFilterSchema = z.object({
  cabangId: z.string({ required_error: "Cabang harus dipilih" }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  produkId: z.string().optional(),
  type: z.enum(["all", "in", "out", "adjustment", "transfer"]).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
});
