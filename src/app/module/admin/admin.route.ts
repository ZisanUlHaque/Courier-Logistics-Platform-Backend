import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminValidation } from "./admin.validation";
import { AdminController } from "./admin.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/shipments/:id/assign-courier",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.AssignCourierZodSchema),
  AdminController.assignCourier,
);
router.patch(
  "/users/:id/status",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.UpdateUserStatusZodSchema),
  AdminController.updateUserStatus,
);
router.get("/users", auth(UserRole.ADMIN), AdminController.getAllUsers);
router.get(
  "/dashboard",
  auth(UserRole.ADMIN),
  AdminController.getDashboardStats,
);

export const AdminRoutes = router;
