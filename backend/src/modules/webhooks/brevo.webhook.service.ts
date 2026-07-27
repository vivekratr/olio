import { runTransaction } from "../../common/database/base.repository.js";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  CampaignRecipientRepository,
  normalizeProviderMessageId,
} from "../campaigns/campaign-recipient.repository.js";
import { CampaignEventRepository } from "./campaign-event.repository.js";
import {
  isAutomatedBrevoOpen,
  mapBrevoEvent,
  type BrevoWebhookPayload,
} from "./brevo.webhook.schema.js";

export class BrevoWebhookService {
  constructor(
    private readonly campaignEventRepository: CampaignEventRepository,
    private readonly campaignRecipientRepository: CampaignRecipientRepository,
  ) {}

  async handleEvent(payload: BrevoWebhookPayload): Promise<void> {
    const eventType = mapBrevoEvent(payload.event);
    if (!eventType) {
      return;
    }

    if (eventType === "opened" && isAutomatedBrevoOpen(payload)) {
      return;
    }

    // Brevo reuses payload.id across different messages; scope by message + event.
    const providerEventId = `${normalizeProviderMessageId(payload["message-id"])}:${payload.event}`;
    if (await this.campaignEventRepository.exists(providerEventId)) {
      return;
    }

    const recipient =
      await this.campaignRecipientRepository.findByProviderMessageId(
        payload["message-id"],
      );
    if (!recipient) {
      return;
    }

    await runTransaction(async (tx) => {
      const eventRepository = new CampaignEventRepository(tx);
      const recipientRepository = new CampaignRecipientRepository(tx);

      if (await eventRepository.exists(providerEventId)) {
        return;
      }

      await eventRepository.create({
        campaignRecipientId: recipient.id,
        providerEventId,
        eventType,
        rawPayload: payload as Prisma.InputJsonValue,
      });

      await recipientRepository.updateStatus(recipient.id, eventType);
    });
  }
}
