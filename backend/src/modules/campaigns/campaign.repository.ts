import { Prisma } from "../../generated/prisma/client.js";
import { BaseRepository } from "../../common/database/base.repository.js";
import type { Campaign } from "../../generated/prisma/client.js";
import type { CampaignAttachment } from "./campaign.attachment.js";
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
    const { copyAttachmentFrom, ...campaignData } = data;
    const createData: Prisma.CampaignUncheckedCreateInput = {
      accountId,
      name: campaignData.name,
      subject: campaignData.subject,
      bodyHtml: campaignData.bodyHtml,
      recipientMode: campaignData.recipientMode,
      status: "draft",
    };

    if (campaignData.recipientMode === "audience") {
      createData.audienceId = campaignData.audienceId ?? null;
    } else if (campaignData.recipientMode === "tag") {
      createData.tagId = campaignData.tagId ?? null;
    } else if (campaignData.pastedRecipients) {
      createData.pastedRecipients = campaignData.pastedRecipients;
    }

    const campaign = await this.prisma.campaign.create({ data: createData });

    if (copyAttachmentFrom) {
      await this.copyAttachment(accountId, copyAttachmentFrom, campaign.id);
      const withAttachment = await this.findById(accountId, campaign.id);
      if (withAttachment) {
        return withAttachment;
      }
    }

    return campaign;
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

  async listScheduled(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { status: "scheduled", scheduledAt: { not: null } },
    });
  }

  async setQueueJobId(campaignId: string, queueJobId: string): Promise<void> {
    await this.prisma.campaign.updateMany({
      where: { id: campaignId, status: "scheduled" },
      data: { queueJobId },
    });
  }

  async updateQueueJobId(
    accountId: string,
    campaignId: string,
    queueJobId: string,
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.updateMany({
      where: { id: campaignId, accountId },
      data: { queueJobId },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, campaignId);
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
    if (data.audienceId !== undefined) {
      updateData.audienceId = data.audienceId;
    }
    if (data.tagId !== undefined) {
      updateData.tagId = data.tagId;
    }
    if (data.pastedRecipients !== undefined) {
      updateData.pastedRecipients = data.pastedRecipients;
    }

    if (data.recipientMode === "audience") {
      updateData.tagId = null;
      updateData.pastedRecipients = Prisma.JsonNull;
    } else if (data.recipientMode === "tag") {
      updateData.audienceId = null;
      updateData.pastedRecipients = Prisma.JsonNull;
    } else if (data.recipientMode === "paste") {
      updateData.audienceId = null;
      updateData.tagId = null;
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

  async setAttachment(
    accountId: string,
    campaignId: string,
    attachment: CampaignAttachment,
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
        accountId,
        status: { in: ["draft", "scheduled"] },
      },
      data: { attachment: attachment as unknown as Prisma.InputJsonValue },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, campaignId);
  }

  async clearAttachment(
    accountId: string,
    campaignId: string,
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
        accountId,
        status: { in: ["draft", "scheduled"] },
      },
      data: { attachment: Prisma.JsonNull },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, campaignId);
  }

  async copyAttachment(
    accountId: string,
    fromCampaignId: string,
    toCampaignId: string,
  ): Promise<boolean> {
    const source = await this.findById(accountId, fromCampaignId);
    if (!source?.attachment) {
      return false;
    }

    const result = await this.prisma.campaign.updateMany({
      where: {
        id: toCampaignId,
        accountId,
        status: { in: ["draft", "scheduled"] },
      },
      data: { attachment: source.attachment as Prisma.InputJsonValue },
    });

    return result.count > 0;
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
