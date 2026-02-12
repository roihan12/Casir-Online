import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Password minimal 6 karakter' })
    .nonempty({ message: 'Password tidak boleh kosong' }),
  confirmPassword: z
    .string()
    .min(6, { message: 'Konfirmasi password minimal 6 karakter' })
    .nonempty({ message: 'Konfirmasi password tidak boleh kosong' }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password harus sama',
  path: ['confirmPassword'],
});

export default resetPasswordSchema;
