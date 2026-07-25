import { AppError } from "../../common/errors/app-error.js";
import type { Campaign } from "../../generated/prisma/client.js";
import { TagService } from "../tags/tag.service.js";
import { CampaignRecipientResolver } from "./campaign-recipient.resolver.js";
import { CampaignRepository } from "./campaign.repository.js";
import { CampaignScheduler } from "./campaign.scheduler.js";
import type {
  CampaignResponse,
  PreviewRecipientsInput,
  PreviewRecipientsResponse,
  RecipientMode,
  RecipientResolutionResult,
  ScheduleCampaignInput,
} from "./campaign.types.js";

const CAMPAIGN_NOT_FOUND_MESSAGE = "Campaign not found";
const CAMPAIGN_STATE_CONFLICT_MESSAGE =
  "Campaign cannot be updated in its current state";

export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly recipientResolver: CampaignRecipientResolver,
    private readonly tagService: TagService,
    private readonly campaignScheduler: CampaignScheduler,
  ) {}

  async previewRecipients(
    accountId: string,
    campaignId: string,
    input: PreviewRecipientsInput,
  ): Promise<PreviewRecipientsResponse> {
    const campaign = await this.findCampaignOrThrow(accountId, campaignId);

    const result = await this.resolveRecipients(
      accountId,
      campaign.recipientMode as RecipientMode,
      input,
    );

    return {
      matched: result.matched,
      unmatched: result.unmatched,
      totalMatched: result.matched.length,
      totalUnmatched: result.unmatched.length,
    };
  }

  async scheduleCampaign(
    accountId: string,
    campaignId: string,
    input: ScheduleCampaignInput,
  ): Promise<CampaignResponse> {
    const campaign = await this.findCampaignOrThrow(accountId, campaignId);
    const transition = this.campaignScheduler.schedule(
      campaign,
      new Date(input.scheduledAt),
    );

    const updated = await this.campaignRepository.transitionStatus(
      accountId,
      campaignId,
      transition.fromStatus,
      transition.toStatus,
      transition.scheduledAt,
    );

    if (!updated) {
      throw new AppError(CAMPAIGN_STATE_CONFLICT_MESSAGE, 409);
    }

    return this.toCampaignResponse(updated);
  }

  async sendCampaignNow(
    accountId: string,
    campaignId: string,
  ): Promise<CampaignResponse> {
    const campaign = await this.findCampaignOrThrow(accountId, campaignId);
    const transition = this.campaignScheduler.sendNow(campaign);

    const updated = await this.campaignRepository.transitionStatus(
      accountId,
      campaignId,
      transition.fromStatus,
      transition.toStatus,
      transition.scheduledAt,
    );

    if (!updated) {
      throw new AppError(CAMPAIGN_STATE_CONFLICT_MESSAGE, 409);
    }

    return this.toCampaignResponse(updated);
  }

  private async findCampaignOrThrow(
    accountId: string,
    campaignId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(
      accountId,
      campaignId,
    );
    if (!campaign) {
      throw new AppError(CAMPAIGN_NOT_FOUND_MESSAGE, 404);
    }

    return campaign;
  }

  private async resolveRecipients(
    accountId: string,
    recipientMode: RecipientMode,
    input: PreviewRecipientsInput,
  ): Promise<RecipientResolutionResult> {
    switch (recipientMode) {
      case "audience": {
        if (!input.audienceId) {
          throw new AppError("Audience id is required", 400);
        }
        return this.recipientResolver.resolveAudienceRecipients(
          accountId,
          input.audienceId,
        );
      }
      case "tag": {
        if (!input.tagId) {
          throw new AppError("Tag id is required", 400);
        }
        const matched = await this.tagService.getContactsForTag(
          accountId,
          input.tagId,
        );
        return { matched, unmatched: [] };
      }
      case "paste": {
        if (!input.pasted?.length) {
          throw new AppError("Pasted recipients are required", 400);
        }
        return this.recipientResolver.resolveManualRecipients(
          accountId,
          input.pasted,
        );
      }
      default: {
        const exhaustiveCheck: never = recipientMode;
        throw new AppError(`Unknown recipient mode: ${exhaustiveCheck}`, 400);
      }
    }
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
