import type { Response } from "express";

interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200,
): Response<SuccessBody<T>> =>
  res.status(status).json({
    success: true,
    message,
    data,
  });
