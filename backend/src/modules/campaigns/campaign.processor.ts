import type { Job } from "bullmq";

import { logger } from "../../common/logger/logger.js";
import type { CampaignSendJobData } from "../../infrastructure/queue/campaign.queue.js";
import type { CampaignService } from "./campaign.service.js";

export class CampaignProcessor {
  constructor(private readonly campaignService: CampaignService) {}

  async process(job: Job<CampaignSendJobData>): Promise<void> {
    const { accountId, campaignId } = job.data;

    try {
      await this.campaignService.prepareCampaign(accountId, campaignId);
      await this.campaignService.markSending(accountId, campaignId);
      await this.campaignService.deliverCampaign(accountId, campaignId);
      await this.campaignService.markSent(accountId, campaignId);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : String(error);
      logger.error(`Campaign job failed: ${campaignId}: ${detail}`, {
        error,
        accountId,
      });
      await this.campaignService.markFailed(accountId, campaignId);
      throw error;
    }
  }
}
