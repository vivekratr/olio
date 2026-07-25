import { BaseRepository } from "../../common/database/base.repository.js";
import type { CampaignRecipient } from "../../generated/prisma/client.js";

export class CampaignRecipientRepository extends BaseRepository {
  async createMany(
    campaignId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    await this.prisma.campaignRecipient.createMany({
      data: contactIds.map((contactId) => ({ campaignId, contactId })),
      skipDuplicates: true,
    });
  }

  async findByCampaign(campaignId: string): Promise<CampaignRecipient[]> {
    return this.prisma.campaignRecipient.findMany({
      where: { campaignId },
    });
  }

  async deleteByCampaign(campaignId: string): Promise<void> {
    await this.prisma.campaignRecipient.deleteMany({
      where: { campaignId },
    });
  }
}
