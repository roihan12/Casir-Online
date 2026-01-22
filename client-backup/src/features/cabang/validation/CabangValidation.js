import { z } from "zod";

export const cabangSchema = z
  .object({
    namaCabang: z.string().min(1, { message: "Nama cabang wajib diisi" }),
    alamat: z.string().optional(),
    telepon: z
      .string()
      .regex(/^\d{8,15}$/, { message: "Format nomor telepon tidak valid" })
      .optional()
      .or(z.literal("")),
    latitude: z
      .string()
      .regex(/^-?\d+(\.\d+)?$/, { message: "Format latitude tidak valid" })
      .optional()
      .or(z.literal("")),
    longitude: z
      .string()
      .regex(/^-?\d+(\.\d+)?$/, { message: "Format longitude tidak valid" })
      .optional()
      .or(z.literal("")),
    radiusGeofence: z
      .string()
      .regex(/^\d+$/, { message: "Radius geofence harus berupa angka" })
      .optional()
      .or(z.literal("")),
    status: z.enum(["aktif", "nonaktif"]),
  })
  .refine(
    (data) => {
      // Either both latitude and longitude are provided or neither
      return (
        (data.latitude && data.longitude) || (!data.latitude && !data.longitude)
      );
    },
    {
      message: "Latitude dan longitude harus diisi keduanya",
      path: ["latitude"], // This will show the error on the latitude field
    }
  );

export default cabangSchema;
