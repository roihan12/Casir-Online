import { z } from "zod";

// Category validation schema
export const categorySchema = z.object({
  namaKategori: z
    .string()
    .min(1, "Nama kategori harus diisi")
    .max(100, "Nama kategori maksimal 100 karakter"),
  deskripsi: z.string().max(200, "Deskripsi maksimal 200 karakter").optional(),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
});

export default categorySchema;
