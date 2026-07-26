import type { Contact } from "../../generated/prisma/client.js";
import { ContactRepository } from "../contacts/contact.repository.js";
import { normalizePhone } from "../contacts/contact.service.js";
import type { ContactResponse } from "../contacts/contact.types.js";
import { AudienceService } from "../audiences/audience.service.js";
import type { RecipientResolutionResult } from "./campaign.types.js";

type PastedRecipient = {
  type: "email" | "phone";
  value: string;
};

export class CampaignRecipientResolver {
  constructor(
    private readonly audienceService: AudienceService,
    private readonly contactRepository: ContactRepository,
  ) {}

  async resolveAudienceRecipients(
    accountId: string,
    audienceId: string,
  ): Promise<RecipientResolutionResult> {
    const matched = await this.audienceService.resolveAudience(
      accountId,
      audienceId,
    );
    return { matched, unmatched: [] };
  }

  async resolveManualRecipients(
    accountId: string,
    pasted: string[],
  ): Promise<RecipientResolutionResult> {
    const matched: ContactResponse[] = [];
    const unmatched: string[] = [];
    const seenPasted = new Set<string>();
    const seenContactIds = new Set<string>();

    for (const raw of pasted) {
      const normalized = this.normalizePastedRecipient(raw);
      if (!normalized) {
        continue;
      }

      const dedupeKey = `${normalized.type}:${normalized.value}`;
      if (seenPasted.has(dedupeKey)) {
        continue;
      }
      seenPasted.add(dedupeKey);

      const contact = await this.lookupContact(accountId, normalized);
      if (!contact) {
        unmatched.push(normalized.value);
        continue;
      }

      if (seenContactIds.has(contact.id)) {
        continue;
      }
      seenContactIds.add(contact.id);
      matched.push(this.toContactResponse(contact));
    }

    return { matched, unmatched };
  }

  private normalizePastedRecipient(raw: string): PastedRecipient | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.includes("@")) {
      return { type: "email", value: trimmed.toLowerCase() };
    }

    const phone = normalizePhone(trimmed);
    if (!phone) {
      return null;
    }

    return { type: "phone", value: phone };
  }

  private async lookupContact(
    accountId: string,
    recipient: PastedRecipient,
  ): Promise<Contact | null> {
    if (recipient.type === "email") {
      return this.contactRepository.findByEmail(accountId, recipient.value);
    }

    return this.contactRepository.findByPhone(accountId, recipient.value);
  }

  private toContactResponse(contact: Contact): ContactResponse {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      tags: [],
      customFields: contact.customFields as Record<string, unknown>,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}
