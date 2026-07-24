import { AppError } from "../errors/app-error.js";
import type { Request, NextFunction, Response } from "express";

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message,
  });
};
