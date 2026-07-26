import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { AnalyticsService } from "../analytics/analytics.service.js";
import type { CampaignService } from "./campaign.service.js";
import type {
  CreateCampaignInput,
  PreviewRecipientsRequest,
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

  previewRecipients: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const data = await this.campaignService.previewRecipientsInput(
        req.user.accountId,
        req.body as PreviewRecipientsRequest,
      );
      successResponse(res, data, "Recipients previewed successfully");
    },
  );

  uploadAttachment: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.file) {
        throw new AppError("PDF file is required", 400);
      }

      const data = await this.campaignService.setCampaignAttachment(
        req.user.accountId,
        req.params.id as string,
        req.file,
      );
      successResponse(res, data, "Attachment uploaded successfully");
    },
  );

  deleteAttachment: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const data = await this.campaignService.clearCampaignAttachment(
        req.user.accountId,
        req.params.id as string,
      );
      successResponse(res, data, "Attachment removed successfully");
    },
  );
}
