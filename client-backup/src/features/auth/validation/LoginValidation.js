import { z } from "zod";

const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username minimal 3 karakter" })
    .nonempty({ message: "Username tidak boleh kosong" }),
  password: z
    .string()
    .min(5, { message: "Password minimal 5 karakter" })
    .nonempty({ message: "Password tidak boleh kosong" }),
});

export default loginSchema;