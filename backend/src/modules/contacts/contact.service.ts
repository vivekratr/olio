import { AppError } from "../../common/errors/app-error.js";
import type { Contact } from "../../generated/prisma/client.js";
import type { ContactRepository } from "./contact.repository.js";
import type { ListContactsQuery } from "./contact.schema.js";
import type {
  ContactListResponse,
  ContactResponse,
  CreateContactInput,
  ListContactsOptions,
  UpdateContactInput,
} from "./contact.types.js";

const DUPLICATE_CONTACT_MESSAGE =
  "Contact with this email or phone already exists.";
const CONTACT_NOT_FOUND_MESSAGE = "Contact not found";

export class ContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  async createContact(
    accountId: string,
    input: CreateContactInput,
  ): Promise<ContactResponse> {
    const data = this.normalizeCreateInput(input);
    await this.assertNoDuplicate(accountId, data);

    const contact = await this.contactRepository.create(accountId, data);
    return this.toContactResponse(contact);
  }

  async getContact(
    accountId: string,
    contactId: string,
  ): Promise<ContactResponse> {
    const contact = await this.contactRepository.findById(accountId, contactId);
    if (!contact) {
      throw new AppError(CONTACT_NOT_FOUND_MESSAGE, 404);
    }

    return this.toContactResponse(contact);
  }

  async listContacts(
    accountId: string,
    query: ListContactsQuery,
  ): Promise<ContactListResponse> {
    const options = this.buildListOptions(query);
    const { items, total } = await this.contactRepository.list(
      accountId,
      options,
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);

    return {
      items: items.map((contact) => this.toContactResponse(contact)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPreviousPage: options.page > 1,
      },
    };
  }

  async updateContact(
    accountId: string,
    contactId: string,
    input: UpdateContactInput,
  ): Promise<ContactResponse> {
    const existing = await this.contactRepository.findById(accountId, contactId);
    if (!existing) {
      throw new AppError(CONTACT_NOT_FOUND_MESSAGE, 404);
    }

    const data = this.normalizeUpdateInput(input);
    await this.assertNoDuplicate(accountId, data, contactId);

    const contact = await this.contactRepository.update(
      accountId,
      contactId,
      data,
    );
    if (!contact) {
      throw new AppError(CONTACT_NOT_FOUND_MESSAGE, 404);
    }

    return this.toContactResponse(contact);
  }

  async deleteContact(
    accountId: string,
    contactId: string,
  ): Promise<ContactResponse> {
    const contact = await this.contactRepository.delete(accountId, contactId);
    if (!contact) {
      throw new AppError(CONTACT_NOT_FOUND_MESSAGE, 404);
    }

    return this.toContactResponse(contact);
  }

  private buildListOptions(query: ListContactsQuery): ListContactsOptions {
    const search = query.search?.trim();
    const options: ListContactsOptions = {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
    };

    if (search) {
      options.search = search;
      const phoneSearch = this.normalizePhone(search);
      if (phoneSearch) {
        options.phoneSearch = phoneSearch;
      }
    }

    return options;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private normalizeCreateInput(input: CreateContactInput): CreateContactInput {
    const data: CreateContactInput = {};

    if (input.name !== undefined) {
      data.name = input.name.trim();
    }
    if (input.email !== undefined) {
      data.email = this.normalizeEmail(input.email);
    }
    if (input.phone !== undefined) {
      data.phone = this.normalizePhone(input.phone);
    }
    if (input.customFields !== undefined) {
      data.customFields = input.customFields;
    }

    return data;
  }

  private normalizeUpdateInput(input: UpdateContactInput): UpdateContactInput {
    const data: UpdateContactInput = {};

    if (input.name !== undefined) {
      data.name = input.name.trim();
    }
    if (input.email !== undefined) {
      data.email = input.email ? this.normalizeEmail(input.email) : input.email;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone ? this.normalizePhone(input.phone) : input.phone;
    }
    if (input.customFields !== undefined) {
      data.customFields = input.customFields;
    }

    return data;
  }

  private async assertNoDuplicate(
    accountId: string,
    data: { email?: string; phone?: string },
    excludeContactId?: string,
  ): Promise<void> {
    if (data.email) {
      const existing = await this.contactRepository.findByEmail(
        accountId,
        data.email,
      );
      if (existing && existing.id !== excludeContactId) {
        throw new AppError(DUPLICATE_CONTACT_MESSAGE, 409);
      }
    }

    if (data.phone) {
      const existing = await this.contactRepository.findByPhone(
        accountId,
        data.phone,
      );
      if (existing && existing.id !== excludeContactId) {
        throw new AppError(DUPLICATE_CONTACT_MESSAGE, 409);
      }
    }
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
