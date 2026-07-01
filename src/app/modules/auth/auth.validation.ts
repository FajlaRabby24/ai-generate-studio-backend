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
    .min(8, "Password must be at least 8 characters long"),
  image: z.string().optional(),
});

const loginValidationSchema = z.object({
  email: z
    .string({
      error: "Email is required",
    })
    .email("Invalid email address"),
  password: z
    .string({
      error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters long"),
  userAgent: z.string().optional(),
});

const updateProfileSchema = z.object({
  name: z
    .string({
      error: "Name must be a string",
    })
    .optional(),
  image: z
    .string({
      error: "Image must be a string",
    })
    .optional(),
  phone: z
    .string({
      error: "Phone must be a string",
    })
    .optional(),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileSchema,
};
