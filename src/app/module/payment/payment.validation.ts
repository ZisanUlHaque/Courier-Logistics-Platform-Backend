import z from "zod";

const InitiatePaymentZodSchema = z.object({
  shipmentId: z.string().uuid("Invalid shipment ID"),
  method: z.enum(["BKASH", "COD"]).optional().default("BKASH"),
});

export const PaymentValidation = {
  InitiatePaymentZodSchema,
};
