import z from "zod";

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  weight: z.number().positive().optional(),
  declaredValue: z.number().nonnegative().optional(),
});

const CreateShipmentZodSchema = z.object({
  packageType: z
    .enum([
      "DOCUMENT",
      "SMALL_PARCEL",
      "MEDIUM_PARCEL",
      "LARGE_PARCEL",
      "FRAGILE",
      "HAZARDOUS",
    ])
    .optional(),
  weight: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  declaredValue: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  codAmount: z.number().nonnegative().optional(),
  specialInstructions: z.string().max(500).optional(),
  pickupSchedule: z.string().datetime().optional(),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  items: z.array(itemSchema).min(1, "At least one item required"),
});

const UpdateShipmentZodSchema = z.object({
  packageType: z
    .enum([
      "DOCUMENT",
      "SMALL_PARCEL",
      "MEDIUM_PARCEL",
      "LARGE_PARCEL",
      "FRAGILE",
      "HAZARDOUS",
    ])
    .optional(),
  weight: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  specialInstructions: z.string().max(500).optional(),
  pickupSchedule: z.string().datetime().optional(),
});

export const ShipmentValidation = {
  CreateShipmentZodSchema,
  UpdateShipmentZodSchema,
};
