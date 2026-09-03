import z from "zod";

const AddTrackingEventZodSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PICKUP_SCHEDULED",
    "COURIER_ASSIGNED",
    "PICKED_UP",
    "AT_ORIGIN_HUB",
    "IN_TRANSIT",
    "AT_DESTINATION_HUB",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERY_FAILED",
    "RETURN_INITIATED",
    "RETURN_IN_TRANSIT",
    "RETURNED",
    "CANCELLED",
  ]),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters long"),
  location: z.string().optional(),
});

export const TrackingValidation = {
  AddTrackingEventZodSchema,
};
