import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { logger } from "../logger/logger.js";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten(),
    });
    return;
  }

  logger.error(err instanceof Error ? err.message : "Unknown error", { err });

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
