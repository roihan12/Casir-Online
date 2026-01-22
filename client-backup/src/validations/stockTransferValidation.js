import { z } from "zod";

export const stockTransferSchema = z.object({
  cabangAsalId: z.string({
    required_error: "Cabang asal wajib dipilih",
  }),
  cabangTujuanId: z.string({
    required_error: "Cabang tujuan wajib dipilih",
  }),
  items: z
    .array(
      z.object({
        produkId: z.string({
          required_error: "Produk wajib dipilih",
        }),
        jumlahKirim: z
          .number({
            required_error: "Jumlah kirim wajib diisi",
            invalid_type_error: "Jumlah harus berupa angka",
          })
          .int("Jumlah harus berupa bilangan bulat")
          .positive("Jumlah harus lebih dari 0"),
        keterangan: z.string().optional(),
      })
    )
    .min(1, { message: "Minimal satu produk harus dipilih" }),
  keterangan: z.string().optional(),
  tanggalKirim: z.date().optional().nullable(),
});

export const stockTransferRejectSchema = z.object({
  alasanReject: z
    .string({
      required_error: "Alasan penolakan wajib diisi",
    })
    .min(5, { message: "Alasan penolakan minimal 5 karakter" }),
});

export const stockTransferCancelSchema = z.object({
  alasanBatal: z
    .string({
      required_error: "Alasan pembatalan wajib diisi",
    })
    .min(5, { message: "Alasan pembatalan minimal 5 karakter" }),
});

export const stockTransferReceiveSchema = z.object({
  tanggalTerima: z.date({
    required_error: "Tanggal penerimaan wajib diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
  items: z
    .array(
      z.object({
        transferDetailId: z.string({
          required_error: "Transfer detail ID wajib diisi",
        }),
        jumlahTerima: z
          .number({
            required_error: "Jumlah terima wajib diisi",
            invalid_type_error: "Jumlah harus berupa angka",
          })
          .int("Jumlah harus berupa bilangan bulat")
          .min(0, "Jumlah tidak boleh negatif"),
        keterangan: z.string().optional(),
      })
    )
    .min(1, { message: "Minimal satu item harus diterima" }),
  keterangan: z.string().optional(),
});
