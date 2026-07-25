import { AppError } from "../../common/errors/app-error.js";
import type { Contact } from "../../generated/prisma/client.js";
import { ContactRepository } from "../contacts/contact.repository.js";
import type { ContactResponse } from "../contacts/contact.types.js";
import { AudienceQueryBuilder } from "./audience-query.builder.js";
import { AudienceRepository } from "./audience.repository.js";
import type { AudienceFilter } from "./audience.types.js";

const AUDIENCE_NOT_FOUND_MESSAGE = "Audience not found";
const PREVIEW_LIMIT = 50;

export class AudienceService {
  constructor(
    private readonly audienceRepository: AudienceRepository,
    private readonly contactRepository: ContactRepository,
    private readonly queryBuilder: AudienceQueryBuilder = new AudienceQueryBuilder(),
  ) {}

  async previewAudience(
    accountId: string,
    audienceId: string,
  ): Promise<ContactResponse[]> {
    const contacts = await this.findContacts(accountId, audienceId, {
      limit: PREVIEW_LIMIT,
    });
    return contacts.map((contact) => this.toContactResponse(contact));
  }

  async countAudience(accountId: string, audienceId: string): Promise<number> {
    const where = await this.buildContactWhere(accountId, audienceId);
    return this.contactRepository.countByAudienceWhere(accountId, where);
  }

  async resolveAudience(
    accountId: string,
    audienceId: string,
  ): Promise<ContactResponse[]> {
    const contacts = await this.findContacts(accountId, audienceId);
    return contacts.map((contact) => this.toContactResponse(contact));
  }

  private async findContacts(
    accountId: string,
    audienceId: string,
    options?: { limit?: number },
  ): Promise<Contact[]> {
    const where = await this.buildContactWhere(accountId, audienceId);
    return this.contactRepository.findByAudienceWhere(accountId, where, options);
  }

  private async buildContactWhere(
    accountId: string,
    audienceId: string,
  ) {
    const audience = await this.audienceRepository.findById(
      accountId,
      audienceId,
    );
    if (!audience) {
      throw new AppError(AUDIENCE_NOT_FOUND_MESSAGE, 404);
    }

    return this.queryBuilder.build(audience.filter as unknown as AudienceFilter);
  }

  private toContactResponse(contact: Contact): ContactResponse {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      customFields: contact.customFields as Record<string, unknown>,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}
