import type { NextFunction, Request, Response } from "express";

import { env } from "../../common/config/env.js";
import { AppError } from "../../common/errors/app-error.js";

const BEARER_PREFIX = "Bearer ";

export const verifyBrevoWebhook = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const expectedToken = env.BREVO_WEBHOOK_TOKEN;
  if (!expectedToken) {
    next();
    return;
  }

  const authorization = req.headers.authorization;
  if (
    !authorization?.startsWith(BEARER_PREFIX) ||
    authorization.slice(BEARER_PREFIX.length) !== expectedToken
  ) {
    throw new AppError("Unauthorized webhook", 401);
  }

  next();
};
