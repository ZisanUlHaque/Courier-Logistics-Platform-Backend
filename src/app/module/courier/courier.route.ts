import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CourierController } from "./courier.controller";
import { CourierValidation } from "./courier.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.get("/me", auth(UserRole.COURIER), CourierController.getProfile);
router.patch(
  "/availability",
  auth(UserRole.COURIER),
  validateRequest(CourierValidation.UpdateAvailabilityZodSchema),
  CourierController.updateAvailability,
);
router.get(
  "/shipments",
  auth(UserRole.COURIER),
  CourierController.getAssignedShipments,
);

export const CourierRoutes = router;
