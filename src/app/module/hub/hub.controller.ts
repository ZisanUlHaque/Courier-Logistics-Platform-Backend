import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { HubService } from "./hub.service";

const createHub = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.createHub(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Hub created",
    data: result,
  });
});

const getAllHubs = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getAllHubs(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hubs fetched",
    data: result.data,
    meta: result.meta,
  });
});

const updateHub = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.updateHub(String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hub updated",
    data: result,
  });
});

const deleteHub = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.deleteHub(String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hub deleted",
    data: result,
  });
});

export const HubController = { createHub, getAllHubs, updateHub, deleteHub };
