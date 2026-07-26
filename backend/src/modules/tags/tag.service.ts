import { runTransaction } from "../../common/database/base.repository.js";
import { AppError } from "../../common/errors/app-error.js";
import type { Contact, Tag } from "../../generated/prisma/client.js";
import { ContactRepository } from "../contacts/contact.repository.js";
import type { ContactResponse } from "../contacts/contact.types.js";
import { ContactTagRepository } from "./contact-tag.repository.js";
import { TagRepository } from "./tag.repository.js";
import type {
  CreateTagInput,
  TagResponse,
  UpdateTagInput,
} from "./tag.types.js";

const CONTACT_NOT_FOUND_MESSAGE = "Contact not found";
const TAG_NOT_FOUND_MESSAGE = "Tag not found";

export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly contactRepository: ContactRepository,
    private readonly contactTagRepository: ContactTagRepository,
  ) {}

  async listTags(accountId: string): Promise<TagResponse[]> {
    const tags = await this.tagRepository.list(accountId);
    return tags.map((tag) => this.toTagResponse(tag));
  }

  async createTag(
    accountId: string,
    input: CreateTagInput,
  ): Promise<TagResponse> {
    const tag = await this.tagRepository.create(accountId, input);
    return this.toTagResponse(tag);
  }

  async updateTag(
    accountId: string,
    tagId: string,
    input: UpdateTagInput,
  ): Promise<TagResponse> {
    const tag = await this.tagRepository.update(accountId, tagId, input);
    if (!tag) {
      throw new AppError(TAG_NOT_FOUND_MESSAGE, 404);
    }

    return this.toTagResponse(tag);
  }

  async deleteTag(accountId: string, tagId: string): Promise<TagResponse> {
    const tag = await this.tagRepository.delete(accountId, tagId);
    if (!tag) {
      throw new AppError(TAG_NOT_FOUND_MESSAGE, 404);
    }

    return this.toTagResponse(tag);
  }

  async addContactsToTag(
    accountId: string,
    tagId: string,
    contactIds: string[],
  ): Promise<ContactResponse[]> {
    await this.assertTagInAccount(accountId, tagId);
    const uniqueContactIds = [...new Set(contactIds)];
    await Promise.all(
      uniqueContactIds.map((contactId) =>
        this.assertContactInAccount(accountId, contactId),
      ),
    );

    await Promise.all(
      uniqueContactIds.map((contactId) =>
        this.contactTagRepository.assign(contactId, tagId),
      ),
    );

    return this.getContactsForTag(accountId, tagId);
  }

  async removeContactFromTag(
    accountId: string,
    tagId: string,
    contactId: string,
  ): Promise<void> {
    await this.removeTag(accountId, contactId, tagId);
  }

  async assignTags(
    accountId: string,
    contactId: string,
    tagIds: string[],
  ): Promise<TagResponse[]> {
    await this.assertContactInAccount(accountId, contactId);
    const uniqueTagIds = [...new Set(tagIds)];
    await this.assertTagsInAccount(accountId, uniqueTagIds);

    await this.contactTagRepository.assignMany(contactId, uniqueTagIds);
    return this.getTagsForContact(accountId, contactId);
  }

  async replaceTags(
    accountId: string,
    contactId: string,
    tagIds: string[],
  ): Promise<TagResponse[]> {
    await this.assertContactInAccount(accountId, contactId);
    const uniqueTagIds = [...new Set(tagIds)];
    await this.assertTagsInAccount(accountId, uniqueTagIds);

    await runTransaction(async (tx) => {
      const contactTagRepository = new ContactTagRepository(tx);
      await contactTagRepository.removeAll(contactId);
      await contactTagRepository.assignMany(contactId, uniqueTagIds);
    });

    return this.getTagsForContact(accountId, contactId);
  }

  async removeTag(
    accountId: string,
    contactId: string,
    tagId: string,
  ): Promise<void> {
    await this.assertContactInAccount(accountId, contactId);
    await this.assertTagInAccount(accountId, tagId);
    await this.contactTagRepository.remove(contactId, tagId);
  }

  async getTagsForContact(
    accountId: string,
    contactId: string,
  ): Promise<TagResponse[]> {
    await this.assertContactInAccount(accountId, contactId);
    const tags = await this.contactTagRepository.findTagsForContact(
      accountId,
      contactId,
    );
    return tags.map((tag) => this.toTagResponse(tag));
  }

  async getContactsForTag(
    accountId: string,
    tagId: string,
  ): Promise<ContactResponse[]> {
    await this.assertTagInAccount(accountId, tagId);
    const contacts = await this.contactTagRepository.findContactsForTag(
      accountId,
      tagId,
    );
    return contacts.map((contact) => this.toContactResponse(contact));
  }

  private async assertContactInAccount(
    accountId: string,
    contactId: string,
  ): Promise<void> {
    const contact = await this.contactRepository.findById(accountId, contactId);
    if (!contact) {
      throw new AppError(CONTACT_NOT_FOUND_MESSAGE, 404);
    }
  }

  private async assertTagInAccount(
    accountId: string,
    tagId: string,
  ): Promise<void> {
    const tag = await this.tagRepository.findById(accountId, tagId);
    if (!tag) {
      throw new AppError(TAG_NOT_FOUND_MESSAGE, 404);
    }
  }

  private async assertTagsInAccount(
    accountId: string,
    tagIds: string[],
  ): Promise<void> {
    await Promise.all(
      tagIds.map((tagId) => this.assertTagInAccount(accountId, tagId)),
    );
  }

  private toTagResponse(tag: Tag): TagResponse {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt.toISOString(),
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
