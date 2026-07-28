import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, colorize } = winston.format;

function serializeLogMeta(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaKeys = Object.keys(meta).filter((key) => key !== "splat");
  if (metaKeys.length === 0) {
    return `${ts} [${level}]: ${message}`;
  }

  const details = metaKeys
    .map((key) => `${key}=${serializeLogMeta(meta[key])}`)
    .join(" ");
  return `${ts} [${level}]: ${message} ${details}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});
