import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TrackingValidation } from "./tracking.validation";
import { TrackingController } from "./tracking.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/:shipmentId/events",
  auth(UserRole.COURIER, UserRole.ADMIN),
  validateRequest(TrackingValidation.AddTrackingEventZodSchema),
  TrackingController.addTrackingEvent,
);

router.get("/:trackingNumber", TrackingController.getTrackingTimeline);

export const TrackingRoutes = router;
