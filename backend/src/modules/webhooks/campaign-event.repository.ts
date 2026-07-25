import { BaseRepository } from "../../common/database/base.repository.js";
import type { CampaignEvent, Prisma } from "../../generated/prisma/client.js";

export interface CreateCampaignEventInput {
  campaignRecipientId: string;
  providerEventId: string;
  eventType: string;
  rawPayload: Prisma.InputJsonValue;
}

export class CampaignEventRepository extends BaseRepository {
  async create(input: CreateCampaignEventInput): Promise<CampaignEvent> {
    return this.prisma.campaignEvent.create({
      data: input,
    });
  }

  async exists(providerEventId: string): Promise<boolean> {
    const event = await this.prisma.campaignEvent.findUnique({
      where: { providerEventId },
      select: { id: true },
    });

    return event !== null;
  }

  async findByRecipient(campaignRecipientId: string): Promise<CampaignEvent[]> {
    return this.prisma.campaignEvent.findMany({
      where: { campaignRecipientId },
      orderBy: { receivedAt: "asc" },
    });
  }
}
