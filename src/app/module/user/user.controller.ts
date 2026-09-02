import type { Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { RequestWithUser } from "../../types/common";
import { UserService } from "./user.service";

const updateProfile = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await UserService.updateProfile(req.user.userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated",
      data: result,
    });
  },
);

const uploadProfieImage = catchAsync(
  async (req: RequestWithUser, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
  const result = await UserService.uploadProfieImage(
    req.file.buffer,
    req.user.userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Image Upload successfully",
    data: result,
  });
  },
);

export const UserController = { updateProfile, uploadProfieImage };
