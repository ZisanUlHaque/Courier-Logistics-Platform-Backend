import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";

const router = Router();

router.patch(
  "/me",
  auth(UserRole.CUSTOMER, UserRole.COURIER, UserRole.ADMIN),
  validateRequest(UserValidation.UpdateProfileZodSchema),
  UserController.updateProfile,
);

router.patch(
  "/profile-image",
  auth(UserRole.CUSTOMER, UserRole.COURIER, UserRole.ADMIN),
  upload.single("profileImage"),
  UserController.uploadProfieImage,
);

export const UserRoutes = router;
