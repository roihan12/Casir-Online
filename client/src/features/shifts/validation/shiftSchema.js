import { z } from "zod";

export const openShiftSchema = z.object({
  kasAwal: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val >= 0, {
    message: "Kas awal harus berupa angka positif",
  }),
  keterangan: z.string().optional(),
  cabangId: z.string().min(1, "Cabang harus dipilih"),
  userId: z.string().min(1, "User ID diperlukan"),
});

export const closeShiftSchema = z.object({
  kasAkhir: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val >= 0, {
    message: "Kas akhir harus berupa angka positif",
  }),
  keterangan: z.string().optional(),
});

export const adjustShiftSchema = z.object({
  kasAkhir: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val >= 0, {
    message: "Kas akhir harus berupa angka positif",
  }),
  alasanPenyesuaian: z.string().min(1, "Alasan penyesuaian harus diisi"),
  selisih: z.number(),
  keterangan: z.string().optional(),
});
