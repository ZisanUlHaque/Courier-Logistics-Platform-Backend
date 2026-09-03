import z from "zod";

const CreateHubZodSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  phone: z.string().optional(),
});

const UpdateHubZodSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const HubValidation = { CreateHubZodSchema, UpdateHubZodSchema };
