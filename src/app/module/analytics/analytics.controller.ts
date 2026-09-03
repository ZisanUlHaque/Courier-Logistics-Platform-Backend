import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../payment/payment.interface";
import { AnalyticsServices } from "./analytics.service";

const getAdminAnalytics = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsServices.getAdminAnalytics();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin analytics retrieved successfully",
    data: result,
  });
});

const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const result = await AnalyticsServices.getCustomerAnalytics(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer analytics retrieved successfully",
    data: result,
  });
});

const getCourierAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  const result = await AnalyticsServices.getCourierAnalytics(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier analytics retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getAdminAnalytics,
  getCustomerAnalytics,
  getCourierAnalytics,
};
