import { BaseRepository } from "../../common/database/base.repository.js";
import type { Campaign, Prisma } from "../../generated/prisma/client.js";
import type {
  CampaignStatus,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "./campaign.types.js";

export class CampaignRepository extends BaseRepository {
  async create(
    accountId: string,
    data: CreateCampaignInput,
  ): Promise<Campaign> {
    return this.prisma.campaign.create({
      data: {
        accountId,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        recipientMode: data.recipientMode,
        status: "draft",
      },
    });
  }

  async findById(
    accountId: string,
    campaignId: string,
  ): Promise<Campaign | null> {
    return this.prisma.campaign.findFirst({
      where: { id: campaignId, accountId },
    });
  }

  async list(accountId: string): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(
    accountId: string,
    campaignId: string,
    data: UpdateCampaignInput,
  ): Promise<Campaign | null> {
    const updateData: Prisma.CampaignUpdateManyMutationInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.bodyHtml !== undefined) {
      updateData.bodyHtml = data.bodyHtml;
    }
    if (data.recipientMode !== undefined) {
      updateData.recipientMode = data.recipientMode;
    }

    const result = await this.prisma.campaign.updateMany({
      where: { id: campaignId, accountId },
      data: updateData,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, campaignId);
  }

  async delete(
    accountId: string,
    campaignId: string,
  ): Promise<Campaign | null> {
    const campaign = await this.findById(accountId, campaignId);
    if (!campaign) {
      return null;
    }

    return this.prisma.campaign.delete({
      where: { id: campaignId },
    });
  }

  async transitionStatus(
    accountId: string,
    campaignId: string,
    fromStatus: CampaignStatus,
    toStatus: CampaignStatus,
    scheduledAt?: Date | null,
    queueJobId?: string | null,
  ): Promise<Campaign | null> {
    const data: Prisma.CampaignUpdateManyMutationInput = { status: toStatus };

    if (scheduledAt !== undefined) {
      data.scheduledAt = scheduledAt;
    }

    if (queueJobId !== undefined) {
      data.queueJobId = queueJobId;
    }

    const result = await this.prisma.campaign.updateMany({
      where: { id: campaignId, accountId, status: fromStatus },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, campaignId);
  }
}
