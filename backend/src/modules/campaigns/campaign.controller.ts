import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { AnalyticsService } from "../analytics/analytics.service.js";
import type { CampaignService } from "./campaign.service.js";
import type {
  CreateCampaignInput,
  ScheduleCampaignInput,
  UpdateCampaignInput,
} from "./campaign.types.js";

export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.listCampaigns(req.user.accountId);
    successResponse(res, data, "Campaigns retrieved successfully");
  });

  getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.getCampaign(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Campaign retrieved successfully");
  });

  create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.createCampaign(
      req.user.accountId,
      req.body as CreateCampaignInput,
    );
    successResponse(res, data, "Campaign created successfully", 201);
  });

  update: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.updateCampaign(
      req.user.accountId,
      req.params.id as string,
      req.body as UpdateCampaignInput,
    );
    successResponse(res, data, "Campaign updated successfully");
  });

  delete: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.deleteCampaign(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Campaign deleted successfully");
  });

  send: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.sendCampaignNow(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Campaign send started successfully");
  });

  schedule: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.campaignService.scheduleCampaign(
      req.user.accountId,
      req.params.id as string,
      req.body as ScheduleCampaignInput,
    );
    successResponse(res, data, "Campaign scheduled successfully");
  });

  getAnalytics: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const data = await this.analyticsService.getCampaignAnalytics(
        req.user.accountId,
        req.params.id as string,
      );
      successResponse(res, data, "Campaign analytics retrieved successfully");
    },
  );
}
