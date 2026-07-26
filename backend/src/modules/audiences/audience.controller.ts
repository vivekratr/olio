import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { AudienceService } from "./audience.service.js";
import type { PreviewAudienceInput } from "./audience.schema.js";
import type {
  AudienceFilter,
  CreateAudienceInput,
  UpdateAudienceInput,
} from "./audience.types.js";

export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.audienceService.listAudiences(req.user.accountId);
    successResponse(res, data, "Audiences retrieved successfully");
  });

  getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.audienceService.getAudience(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Audience retrieved successfully");
  });

  create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.audienceService.createAudience(
      req.user.accountId,
      req.body as CreateAudienceInput,
    );
    successResponse(res, data, "Audience created successfully", 201);
  });

  update: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.audienceService.updateAudience(
      req.user.accountId,
      req.params.id as string,
      req.body as UpdateAudienceInput,
    );
    successResponse(res, data, "Audience updated successfully");
  });

  delete: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.audienceService.deleteAudience(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Audience deleted successfully");
  });

  preview: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.user.accountId;
    const input = req.body as PreviewAudienceInput;
    const data =
      "audienceId" in input
        ? await this.audienceService.previewAudience(
            accountId,
            input.audienceId,
          )
        : await this.audienceService.previewByFilter(
            accountId,
            input.filter as unknown as AudienceFilter,
          );
    successResponse(res, data, "Audience preview retrieved successfully");
  });
}
