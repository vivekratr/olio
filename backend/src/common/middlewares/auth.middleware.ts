import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyToken } from "../utils/jwt.js";

const BEARER_PREFIX = "Bearer ";

const extractBearerToken = (authorization: string | undefined): string => {
  if (!authorization?.startsWith(BEARER_PREFIX)) {
    throw new AppError("Authentication required", 401);
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  return token;
};

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractBearerToken(req.headers.authorization);

  try {
    const payload = verifyToken(token);

    req.user = {
      id: payload.userId,
      accountId: payload.accountId,
      email: payload.email,
    };

    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};
