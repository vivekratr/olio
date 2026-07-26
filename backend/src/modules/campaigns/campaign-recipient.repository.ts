import { BaseRepository } from "../../common/database/base.repository.js";
import type {
  CampaignRecipient,
  Contact,
} from "../../generated/prisma/client.js";

export type CampaignRecipientWithContact = CampaignRecipient & {
  contact: Contact;
};

/** Brevo send API and webhooks may differ on angle brackets around the message id. */
function normalizeProviderMessageId(messageId: string): string {
  const trimmed = messageId.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

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

  async findPendingByCampaign(
    campaignId: string,
  ): Promise<CampaignRecipientWithContact[]> {
    return this.prisma.campaignRecipient.findMany({
      where: { campaignId, status: "pending" },
      include: { contact: true },
    });
  }

  async markSent(
    recipientId: string,
    providerMessageId: string,
  ): Promise<void> {
    await this.prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: "sent",
        providerMessageId: normalizeProviderMessageId(providerMessageId),
      },
    });
  }

  async markFailed(recipientId: string): Promise<void> {
    await this.prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: "failed" },
    });
  }

  async findByProviderMessageId(
    providerMessageId: string,
  ): Promise<CampaignRecipient | null> {
    const normalized = normalizeProviderMessageId(providerMessageId);
    return this.prisma.campaignRecipient.findFirst({
      where: {
        OR: [
          { providerMessageId: normalized },
          { providerMessageId: `<${normalized}>` },
        ],
      },
    });
  }

  async updateStatus(recipientId: string, status: string): Promise<void> {
    await this.prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status },
    });
  }

  async deleteByCampaign(campaignId: string): Promise<void> {
    await this.prisma.campaignRecipient.deleteMany({
      where: { campaignId },
    });
  }
}
