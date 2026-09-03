import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/initiate",
  auth(UserRole.CUSTOMER),
  validateRequest(PaymentValidation.InitiatePaymentZodSchema),
  PaymentController.initiatePayment,
);

router.get("/bkash/callback", PaymentController.bkashCallback);
router.post("/bkash/callback", PaymentController.bkashCallback);

router.get(
  "/verify/:paymentId",
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  PaymentController.verifyPayment,
);

router.get(
  "/my-payments",
  auth(UserRole.CUSTOMER),
  PaymentController.getMyPayments,
);

router.get(
  "/all-payments",
  auth(UserRole.ADMIN),
  PaymentController.getAllPayments,
);

router.get(
  "/:paymentId",
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;
