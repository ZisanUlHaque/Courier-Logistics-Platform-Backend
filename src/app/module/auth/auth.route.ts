import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.RegisterZodSchema),
  AuthController.registerUser,
);
router.post(
  "/verify-email",
  validateRequest(AuthValidation.VerifyEmailZodSchema),
  AuthController.verifyEmail,
);
router.post(
  "/login",
  validateRequest(AuthValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.COURIER),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
router.post(
  "/forgot-password",
  validateRequest(AuthValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(AuthValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);

export const AuthRoutes = router;
