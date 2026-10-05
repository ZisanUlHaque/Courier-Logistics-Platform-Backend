import type { RequestHandler } from "express";
import httpStatus from "http-status";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export function validateQuery(schema: ZodType): RequestHandler {
  return catchAsync((req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new AppError(httpStatus.BAD_REQUEST, result.error.issues[0]?.message ?? "Invalid query");
    }
    res.locals.validatedQuery = result.data;
    next();
  });
}
