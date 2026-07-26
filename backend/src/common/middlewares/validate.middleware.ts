import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestSource = "body" | "query" | "params";

export const validate =
  <T extends ZodType>(schema: T, source: RequestSource = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
      return;
    }

    if (source === "query") {
      req.validatedQuery = result.data;
      next();
      return;
    }

    req[source] = result.data;
    next();
  };
