import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import type { JwtPayload } from "../../modules/auth/auth.types.js";

const isJwtPayload = (value: unknown): value is JwtPayload =>
  typeof value === "object" &&
  value !== null &&
  "userId" in value &&
  "accountId" in value &&
  typeof value.userId === "string" &&
  typeof value.accountId === "string";

export const generateToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);

export const verifyToken = (token: string): JwtPayload => {
  try {
    const isUser = jwt.verify(token, env.JWT_SECRET);

    if (!isJwtPayload(isUser)) {
      throw new AppError("Unauthorized", 401);
    }

    return { userId: isUser.userId, accountId: isUser.accountId };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Unauthorized", 401);
  }
};
