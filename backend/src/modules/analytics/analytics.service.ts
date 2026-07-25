import { AppError } from "../../common/errors/app-error.js";
import type { Campaign } from "../../generated/prisma/client.js";
import { CampaignRepository } from "../campaigns/campaign.repository.js";
import type {
  CampaignResponse,
  RecipientMode,
} from "../campaigns/campaign.types.js";
import { AnalyticsRepository } from "./analytics.repository.js";
import type {
  CampaignAnalyticsResponse,
  CampaignMetrics,
  CampaignRates,
} from "./analytics.types.js";

const CAMPAIGN_NOT_FOUND_MESSAGE = "Campaign not found";

const safeRate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : numerator / denominator;

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async getCampaignAnalytics(
    accountId: string,
    campaignId: string,
  ): Promise<CampaignAnalyticsResponse> {
    const campaign = await this.campaignRepository.findById(
      accountId,
      campaignId,
    );
    if (!campaign) {
      throw new AppError(CAMPAIGN_NOT_FOUND_MESSAGE, 404);
    }

    const [metrics, timeline] = await Promise.all([
      this.analyticsRepository.getCampaignMetrics(accountId, campaignId),
      this.analyticsRepository.getCampaignTimeline(accountId, campaignId),
    ]);

    return {
      campaign: this.toCampaignResponse(campaign),
      metrics,
      rates: this.toRates(metrics),
      timeline,
    };
  }

  private toRates(metrics: CampaignMetrics): CampaignRates {
    return {
      deliveryRate: safeRate(metrics.delivered, metrics.sent),
      openRate: safeRate(metrics.opened, metrics.delivered),
      bounceRate: safeRate(metrics.bounced, metrics.sent),
    };
  }

  private toCampaignResponse(campaign: Campaign): CampaignResponse {
    return {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      bodyHtml: campaign.bodyHtml,
      recipientMode: campaign.recipientMode as RecipientMode,
      status: campaign.status as CampaignResponse["status"],
      scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}
