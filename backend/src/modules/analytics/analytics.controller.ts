import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { AnalyticsService } from "./analytics.service.js";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getCampaignAnalytics: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const data = await this.analyticsService.getCampaignAnalytics(
        req.user.accountId,
        req.params.id as string,
      );
      successResponse(res, data, "Campaign analytics retrieved successfully");
    },
  );
}
