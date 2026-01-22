import { z } from "zod";

// Schema for creating or updating a product master
export const productMasterSchema = z.object({
  namaProduk: z
    .string()
    .min(1, { message: "Nama produk wajib diisi" })
    .max(100, { message: "Nama produk maksimal 100 karakter" }),

  sku: z
    .string()
    .min(1, { message: "SKU wajib diisi" })
    .max(50, { message: "SKU maksimal 50 karakter" }),

  barcode: z
    .string()
    .max(50, { message: "Barcode maksimal 50 karakter" })
    .optional()
    .or(z.literal("")),

  deskripsi: z.string().optional().or(z.literal("")),

  kategoriId: z.string().min(1, { message: "Kategori wajib dipilih" }),

  brand: z
    .string()
    .max(100, { message: "Brand maksimal 100 karakter" })
    .optional()
    .or(z.literal("")),

  satuan: z
    .string()
    .max(50, { message: "Satuan maksimal 50 karakter" })
    .optional()
    .or(z.literal("")),

  berat: z
    .union([
      z
        .number()
        .nonnegative({ message: "Berat tidak boleh negatif" })
        .optional(),
      z.string().refine((val) => val === "" || !isNaN(parseFloat(val)), {
        message: "Berat harus berupa angka",
      }),
    ])
    .optional(),

  dimensiP: z
    .union([
      z
        .number()
        .nonnegative({ message: "Dimensi panjang tidak boleh negatif" })
        .optional(),
      z.string().refine((val) => val === "" || !isNaN(parseFloat(val)), {
        message: "Dimensi panjang harus berupa angka",
      }),
    ])
    .optional(),

  dimensiL: z
    .union([
      z
        .number()
        .nonnegative({ message: "Dimensi lebar tidak boleh negatif" })
        .optional(),
      z.string().refine((val) => val === "" || !isNaN(parseFloat(val)), {
        message: "Dimensi lebar harus berupa angka",
      }),
    ])
    .optional(),

  dimensiT: z
    .union([
      z
        .number()
        .nonnegative({ message: "Dimensi tinggi tidak boleh negatif" })
        .optional(),
      z.string().refine((val) => val === "" || !isNaN(parseFloat(val)), {
        message: "Dimensi tinggi harus berupa angka",
      }),
    ])
    .optional(),

  isManagedStock: z.boolean().optional().default(false),

  hasExpired: z.boolean().optional().default(false),

  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
});

// Schema for handling product images
export const imageValidationSchema = z.object({
  maxSize: z.number().default(2 * 1024 * 1024), // 2MB default
  allowedTypes: z
    .array(z.string())
    .default(["image/jpeg", "image/png", "image/webp"]),
});

// Validate a single image file
export const validateImage = (
  file,
  schema = imageValidationSchema.parse({})
) => {
  const errors = [];

  // Check if file exists
  if (!file) return { valid: false, errors: ["File tidak ditemukan"] };

  // Check file size
  if (file.size > schema.maxSize) {
    errors.push(
      `Ukuran file terlalu besar (maksimal ${schema.maxSize / (1024 * 1024)}MB)`
    );
  }

  // Check file type
  if (!schema.allowedTypes.includes(file.type)) {
    errors.push(
      `Format file tidak didukung (hanya ${schema.allowedTypes
        .map((type) => type.split("/")[1].toUpperCase())
        .join(", ")})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate an array of image files
export const validateImages = (
  files,
  schema = imageValidationSchema.parse({})
) => {
  if (!files || files.length === 0) return { valid: true, errors: [] };

  const results = Array.from(files).map((file) => validateImage(file, schema));

  return {
    valid: results.every((result) => result.valid),
    errors: results.flatMap((result) => result.errors),
  };
};
