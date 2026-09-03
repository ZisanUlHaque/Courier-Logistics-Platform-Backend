import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { AnalyticsController } from "./analytics.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  "/admin",
  auth(UserRole.ADMIN),
  AnalyticsController.getAdminAnalytics,
);
router.get(
  "/customer",
  auth(UserRole.CUSTOMER),
  AnalyticsController.getCustomerAnalytics,
);
router.get(
  "/courier",
  auth(UserRole.COURIER),
  AnalyticsController.getCourierAnalytics,
);

export const AnalyticsRoutes = router;
