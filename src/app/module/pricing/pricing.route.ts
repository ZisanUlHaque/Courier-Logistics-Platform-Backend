import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { PricingController } from "./pricing.controller";
import { PricingValidation } from "./pricing.validation";

const router = Router();

router.post(
  "/calculate",
  validateRequest(PricingValidation.CalculatePricingZodSchema),
  PricingController.calculatePrice,
);

export const PricingRoutes = router;
