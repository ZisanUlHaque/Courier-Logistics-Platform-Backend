import type { Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { RequestWithUser } from "../../types/common";
import { ShipmentService } from "./shipment.service";
import { UserRole } from "../../../generated/prisma/enums";

const createShipment = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await ShipmentService.createShipment(
      req.user.userId,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Shipment created",
      data: result,
    });
  },
);

const getMyShipments = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await ShipmentService.getMyShipments(
      req.user.userId,
      req.query,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipments fetched",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllShipments = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    const result = await ShipmentService.getAllShipments(req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All shipments",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getShipmentById = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await ShipmentService.getShipmentById(
      String(req.params.id),
      req.user.userId,
      req.user.role as UserRole,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipment details",
      data: result,
    });
  },
);

const updateShipment = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await ShipmentService.updateShipment(
      String(req.params.id),
      req.user.userId,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipment updated",
      data: result,
    });
  },
);

const cancelShipment = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    const result = await ShipmentService.cancelShipment(
      String(req.params.id),
      req.user.userId,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipment cancelled",
      data: result,
    });
  },
);

export const ShipmentController = {
  createShipment,
  getMyShipments,
  getAllShipments,
  getShipmentById,
  updateShipment,
  cancelShipment,
};
