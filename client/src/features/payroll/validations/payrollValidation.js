import { z } from "zod";

export const komponenSchema = z.object({
  nama: z.string().min(1, "Nama komponen wajib diisi"),
  tipe: z.enum(["tunjangan", "potongan"], { required_error: "Tipe komponen wajib dipilih" }),
  nilai: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
  isProrate: z.boolean().default(false),
  keterangan: z.string().optional(),
});

export const tunjanganSchema = z.object({
  userId: z.string().min(1, "Karyawan wajib dipilih"),
  komponenId: z.string().min(1, "Komponen wajib dipilih"),
  nilaiOverride: z.coerce.number().min(0).optional(),
  berlakuDari: z.string().min(1, "Tanggal berlaku wajib diisi"),
  berlakuSampai: z.string().optional().nullable(),
});

export const gajiSchema = z.object({
  gajiPokok: z.coerce.number().min(0, "Gaji pokok tidak boleh negatif"),
  tarifLembur: z.coerce.number().min(0, "Tarif lembur tidak boleh negatif"),
  tipeGaji: z.enum(["bulanan", "harian", "mingguan"], { required_error: "Tipe gaji wajib dipilih" }),
  alasan: z.string().min(5, "Alasan minimal 5 karakter"),
});

export const generateSlipSchema = z.object({
  periode: z.string().min(1, "Periode (YYYY-MM) wajib diisi"),
  cabangId: z.string().min(1, "Cabang wajib dipilih"),
  userIds: z.array(z.string()).optional(),
});

export const finalizeSlipSchema = z.object({
  catatan: z.string().optional(),
});

export const batchFinalizeSlipSchema = z.object({
  periode: z.string().min(1, "Periode (YYYY-MM) wajib diisi"),
  cabangId: z.string().min(1, "Cabang wajib dipilih"),
});
