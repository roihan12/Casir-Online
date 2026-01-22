import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Email tidak valid' })
    .nonempty({ message: 'Email tidak boleh kosong' }),
});

export default forgotPasswordSchema;
