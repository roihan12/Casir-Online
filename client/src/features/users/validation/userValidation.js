import { z } from "zod";

/**
 * Base user schema - common validations
 */
export const userBaseSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  telepon: z
    .string()
    .regex(/^\d{8,15}$/, "Format nomor telepon tidak valid (8-15 digit)")
    .optional()
    .or(z.literal("")),
  status: z.enum(["aktif", "nonaktif"]),
});

/**
 * Create user schema - password required
 */
export const createUserSchema = userBaseSchema
  .extend({
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

/**
 * Update user schema - password optional
 */
export const updateUserSchema = userBaseSchema
  .extend({
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirmPassword,
    {
      message: "Konfirmasi password tidak cocok",
      path: ["confirmPassword"],
    }
  );

/**
 * Factory function to get schema based on mode
 */
export const getUserSchema = (isEditMode = false) => {
  return isEditMode ? updateUserSchema : createUserSchema;
};

export default { createUserSchema, updateUserSchema, getUserSchema };
