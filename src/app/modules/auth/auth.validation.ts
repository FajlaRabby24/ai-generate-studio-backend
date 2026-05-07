import { z } from "zod";

const registerValidationSchema = z.object({
  name: z.string({
    error: "Name is required",
  }),
  email: z
    .string({
      error: "Email is required",
    })
    .email("Invalid email address"),
  password: z
    .string({
      error: "Password is required",
    })
    .min(6, "Password must be at least 6 characters long"),
  image: z.string().optional(),
});

export const AuthValidation = {
  registerValidationSchema,
};
