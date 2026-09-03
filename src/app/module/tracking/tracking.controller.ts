import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { RequestWithUser } from "../../types/common";
import { TrackingService } from "./tracking.service";

const addTrackingEvent = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await TrackingService.addTrackingEvent(
      req.params.shipmentId as string,
      req.user.userId,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Tracking event recorded and shipment updated",
      data: result,
    });
  },
);

const getTrackingTimeline = catchAsync(async (req: Request, res: Response) => {
  const result = await TrackingService.getTrackingTimeline(
    req.params.trackingNumber as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tracking timeline fetched successfully",
    data: result,
  });
});

export const TrackingController = {
  addTrackingEvent,
  getTrackingTimeline,
};
