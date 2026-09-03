import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ShipmentController } from "./shipment.controller";
import { ShipmentValidation } from "./shipment.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(UserRole.CUSTOMER),
  validateRequest(ShipmentValidation.CreateShipmentZodSchema),
  ShipmentController.createShipment,
);
router.get("/", auth(UserRole.CUSTOMER), ShipmentController.getMyShipments);
router.get("/all", auth(UserRole.ADMIN), ShipmentController.getAllShipments);
router.get(
  "/:id",
  auth(UserRole.CUSTOMER, UserRole.COURIER, UserRole.ADMIN),
  ShipmentController.getShipmentById,
);
router.patch(
  "/:id",
  auth(UserRole.CUSTOMER),
  validateRequest(ShipmentValidation.UpdateShipmentZodSchema),
  ShipmentController.updateShipment,
);
router.delete(
  "/:id",
  auth(UserRole.CUSTOMER),
  ShipmentController.cancelShipment,
);

export const ShipmentRoutes = router;
