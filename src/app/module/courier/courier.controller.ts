import type { Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { RequestWithUser } from "../../types/common";
import { CourierService } from "./courier.service";

const getProfile = catchAsync(async (req: RequestWithUser, res: Response) => {
  if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
  const result = await CourierService.getProfile(req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier profile retrieved successfully",
    data: result,
  });
});

const updateAvailability = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await CourierService.updateAvailability(
      req.user.userId,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability status updated successfully",
      data: result,
    });
  },
);

const getAssignedShipments = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await CourierService.getAssignedShipments(
      req.user.userId,
      req.query,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assigned shipments retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const CourierController = {
  getProfile,
  updateAvailability,
  getAssignedShipments,
};
