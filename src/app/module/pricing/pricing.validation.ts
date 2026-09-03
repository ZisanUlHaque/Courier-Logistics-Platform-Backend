import z from "zod";

const CalculatePricingZodSchema = z.object({
  weight: z.number().positive("Weight must be greater than 0"),
  packageType: z.enum([
    "DOCUMENT",
    "SMALL_PARCEL",
    "MEDIUM_PARCEL",
    "LARGE_PARCEL",
    "FRAGILE",
    "HAZARDOUS",
  ]),
  isInterCity: z.boolean().default(false),
});

export const PricingValidation = {
  CalculatePricingZodSchema,
};
