import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./payment.interface";
import { PaymentServices } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const { shipmentId, method } = req.body;

  const result = await PaymentServices.initiatePayment(
    shipmentId,
    user.userId,
    method || "BKASH",
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment session initiated successfully",
    data: result,
  });
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.bkashCallback(
    req.query as Record<string, string>,
  );

  if (result.redirectUrl) {
    return res.redirect(result.redirectUrl);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.success,
    message: result.message,
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const result = await PaymentServices.verifyPayment(
    req.params.paymentId as string,
    user,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status verified",
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const { data, meta } = await PaymentServices.getMyPayments(req.query, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments retrieved successfully",
    data,
    meta,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PaymentServices.getAllPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payments retrieved successfully",
    data,
    meta,
  });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const result = await PaymentServices.getSinglePayment(
    req.params.paymentId as string,
    user,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  bkashCallback,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
