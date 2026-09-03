import z from "zod";

const AssignCourierZodSchema = z.object({
  courierId: z.string().uuid("Invalid Courier User ID"),
});

const UpdateUserStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"], {
    error: "Status must be ACTIVE or SUSPENDED",
  }),
});

export const AdminValidation = {
  AssignCourierZodSchema,
  UpdateUserStatusZodSchema,
};
