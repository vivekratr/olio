import { AppError } from "../../common/errors/app-error.js";
import type { Audience, Contact } from "../../generated/prisma/client.js";
import { ContactRepository } from "../contacts/contact.repository.js";
import type { ContactResponse } from "../contacts/contact.types.js";
import { AudienceQueryBuilder } from "./audience-query.builder.js";
import { AudienceRepository } from "./audience.repository.js";
import type {
  AudienceFilter,
  AudienceResponse,
  CreateAudienceInput,
  UpdateAudienceInput,
} from "./audience.types.js";

const AUDIENCE_NOT_FOUND_MESSAGE = "Audience not found";
const PREVIEW_LIMIT = 50;

export class AudienceService {
  constructor(
    private readonly audienceRepository: AudienceRepository,
    private readonly contactRepository: ContactRepository,
    private readonly queryBuilder: AudienceQueryBuilder = new AudienceQueryBuilder(),
  ) {}

  async listAudiences(accountId: string): Promise<AudienceResponse[]> {
    const audiences = await this.audienceRepository.list(accountId);
    return Promise.all(
      audiences.map((audience) =>
        this.toAudienceResponseWithCount(accountId, audience),
      ),
    );
  }

  async getAudience(
    accountId: string,
    audienceId: string,
  ): Promise<AudienceResponse> {
    const audience = await this.audienceRepository.findById(
      accountId,
      audienceId,
    );
    if (!audience) {
      throw new AppError(AUDIENCE_NOT_FOUND_MESSAGE, 404);
    }

    return this.toAudienceResponseWithCount(accountId, audience);
  }

  async createAudience(
    accountId: string,
    input: CreateAudienceInput,
  ): Promise<AudienceResponse> {
    const audience = await this.audienceRepository.create(accountId, input);
    return this.toAudienceResponseWithCount(accountId, audience);
  }

  async updateAudience(
    accountId: string,
    audienceId: string,
    input: UpdateAudienceInput,
  ): Promise<AudienceResponse> {
    const audience = await this.audienceRepository.update(
      accountId,
      audienceId,
      input,
    );
    if (!audience) {
      throw new AppError(AUDIENCE_NOT_FOUND_MESSAGE, 404);
    }

    return this.toAudienceResponseWithCount(accountId, audience);
  }

  async deleteAudience(
    accountId: string,
    audienceId: string,
  ): Promise<AudienceResponse> {
    const audience = await this.audienceRepository.delete(
      accountId,
      audienceId,
    );
    if (!audience) {
      throw new AppError(AUDIENCE_NOT_FOUND_MESSAGE, 404);
    }

    return this.toAudienceResponseWithCount(accountId, audience);
  }

  async previewByFilter(
    accountId: string,
    filter: AudienceFilter,
  ): Promise<ContactResponse[]> {
    const where = this.queryBuilder.build(filter);
    const contacts = await this.contactRepository.findByAudienceWhere(
      accountId,
      where,
      { limit: PREVIEW_LIMIT },
    );
    return contacts.map((contact) => this.toContactResponse(contact));
  }

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

  private async toAudienceResponseWithCount(
    accountId: string,
    audience: Audience,
  ): Promise<AudienceResponse> {
    return {
      id: audience.id,
      name: audience.name,
      filter: audience.filter as unknown as AudienceFilter,
      memberCount: await this.countAudience(accountId, audience.id),
      createdAt: audience.createdAt.toISOString(),
      updatedAt: audience.updatedAt.toISOString(),
    };
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
