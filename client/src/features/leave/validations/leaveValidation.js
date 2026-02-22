import { z } from "zod";

export const hariLiburSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  nama: z.string().min(1, "Nama libur wajib diisi"),
  isRecurring: z.boolean().default(false),
});

export const importHariLiburSchema = z.object({
  file: z.any().refine((files) => files?.length > 0, "File jadwal kerja wajib diunggah (CSV/Excel)"),
});

export const izinSchema = z.object({
  tipeIzin: z.enum(["izin_sakit", "izin_keperluan"], { required_error: "Tipe izin wajib dipilih" }),
  cabangId: z.string({ required_error: "Cabang wajib diisi" }).min(1, "Cabang wajib diisi"),
  tanggalMulai: z.string({ required_error: "Tanggal mulai wajib diisi" }).min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string({ required_error: "Tanggal selesai wajib diisi" }).min(1, "Tanggal selesai wajib diisi"),
  alasan: z.string({ required_error: "Alasan wajib diisi" }).min(5, "Alasan minimal 5 karakter"),
  // lampiranFile is optional but good to have
  lampiranFile: z.any().optional(),
});

export const cutiSchema = z.object({
  tipeIzin: z.enum(["cuti_tahunan", "cuti_melahirkan", "cuti_bersama", "cuti_khusus"], { required_error: "Tipe cuti wajib dipilih" }),
  cabangId: z.string({ required_error: "Cabang wajib diisi" }).min(1, "Cabang wajib diisi"),
  tanggalMulai: z.string({ required_error: "Tanggal mulai wajib diisi" }).min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string({ required_error: "Tanggal selesai wajib diisi" }).min(1, "Tanggal selesai wajib diisi"),
  alasan: z.string({ required_error: "Alasan wajib diisi" }).min(5, "Alasan minimal 5 karakter"),
});

export const approveIzinCutiSchema = z.object({
  catatanApprover: z.string().min(3, "Catatan wajib diisi (minimal 3 karakter)").optional(),
});

export const rejectIzinCutiSchema = z.object({
  catatanApprover: z.string().min(3, "Catatan penolakan wajib diisi (minimal 3 karakter)"),
});

export const generateKuotaSchema = z.object({
  tahun: z.coerce.number().min(2000, "Tahun tidak valid").max(2100),
  kuotaDefault: z.coerce.number().min(0, "Kuota tidak boleh negatif"),
  carryOver: z.boolean().default(false),
  maxCarryOver: z.coerce.number().min(0).default(0),
});

export const adjustKuotaSchema = z.object({
  kuotaTahunan: z.coerce.number().min(0, "Kuota tidak boleh negatif"),
  alasan: z.string().min(5, "Alasan minimal 5 karakter"),
});
