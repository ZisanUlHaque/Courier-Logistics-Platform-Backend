import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(100),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(64),
    phone: z.string().optional(),
    role: z.enum(["CUSTOMER", "COURIER"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required" }),
  }),
});