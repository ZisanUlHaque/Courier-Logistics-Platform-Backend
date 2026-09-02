import z from "zod";

const UpdateProfileZodSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  profileImage: z.string().url().optional(),
});

const ChangePasswordZodSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be minimum 8 characters")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
});

export const UserValidation = {
  UpdateProfileZodSchema,
  ChangePasswordZodSchema,
};
