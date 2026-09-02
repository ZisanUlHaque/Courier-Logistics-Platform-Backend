import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  await AuthService.registerUser(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification OTP sent to email",
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body);
  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 86400000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 604800000,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email verified successfully",
    data: { accessToken, refreshToken, user },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await AuthService.loginUser(req.body);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 86400000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 604800000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
    data: { accessToken, refreshToken },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;
  if (!user) throw new AppError(httpStatus.UNAUTHORIZED, "User info missing");
  const result = await AuthService.getMe(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched",
    data: result,
  });
});

const refreshTokenCtrl = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies?.refreshToken)
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token missing");
  const { accessToken, refreshToken: newRT } = await AuthService.refreshToken(
    req.cookies.refreshToken,
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 86400000,
  });
  res.cookie("refreshToken", newRT, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 604800000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tokens refreshed",
    data: { accessToken, refreshToken: newRT },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await AuthService.googleLogin(req.body);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 86400000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "none",
    maxAge: 604800000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Google login successful",
    data: { accessToken, refreshToken },
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `OTP sent to ${req.body.email}`,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

export const AuthController = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken: refreshTokenCtrl,
  googleLogin,
  forgotPassword,
  resetPassword,
};
