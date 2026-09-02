import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be minimum 8 characters long")
  .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");

const RegisterZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "COURIER"]).optional(),
});

const VerifyEmailZodSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const LoginZodSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be minimum 8 characters"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.email("Invalid email address"),
});

const ResetPasswordZodSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: passwordSchema,
});

export const AuthValidation = {
  RegisterZodSchema,
  VerifyEmailZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
};