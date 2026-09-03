import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PricingService } from "./pricing.service";

const calculatePrice = catchAsync(async (req: Request, res: Response) => {
  const result = await PricingService.calculatePrice(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shipping fee calculated successfully",
    data: result,
  });
});

export const PricingController = {
  calculatePrice,
};
