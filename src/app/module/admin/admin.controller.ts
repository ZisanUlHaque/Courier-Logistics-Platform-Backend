import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const assignCourier = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.assignCourierToShipment(
    req.params.id as string,
    req.body.courierId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier assigned to shipment successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(
    req.params.id as string,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users list fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard analytics retrieved successfully",
    data: result,
  });
});

export const AdminController = {
  assignCourier,
  updateUserStatus,
  getAllUsers,
  getDashboardStats,
};
