import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import type { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.authService.register(req.body as RegisterInput);
    successResponse(res, data, "Account created successfully", 201);
  });

  login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.authService.login(req.body as LoginInput);
    successResponse(res, data, "Login successful");
  });

  me: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user.id);
    successResponse(res, user, "Authenticated user retrieved successfully");
  });
}
