import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { HubController } from "./hub.controller";
import { HubValidation } from "./hub.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(HubValidation.CreateHubZodSchema),
  HubController.createHub,
);
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.COURIER),
  HubController.getAllHubs,
);
router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(HubValidation.UpdateHubZodSchema),
  HubController.updateHub,
);
router.delete("/:id", auth(UserRole.ADMIN), HubController.deleteHub);

export const HubRoutes = router;
