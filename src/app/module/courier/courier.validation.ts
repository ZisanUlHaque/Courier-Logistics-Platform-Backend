import z from "zod";

const UpdateAvailabilityZodSchema = z.object({
  availabilityStatus: z.enum(["AVAILABLE", "BUSY", "OFFLINE"], {
    error: "Availability status is required",
  }),
  currentLatitude: z.number().min(-90).max(90).optional(),
  currentLongitude: z.number().min(-180).max(180).optional(),
});

export const CourierValidation = {
  UpdateAvailabilityZodSchema,
};
