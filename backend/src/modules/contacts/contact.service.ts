import { AppError } from "../../common/errors/app-error.js";
import { runTransaction } from "../../common/database/base.repository.js";
import type { Contact } from "../../generated/prisma/client.js";
import type { ParsedCsvRow } from "./csv.service.js";
import { ContactRepository } from "./contact.repository.js";
import type { ListContactsQuery } from "./contact.schema.js";
import type {
  ContactListResponse,
  ContactResponse,
  CreateContactInput,
  ImportPlan,
  ImportRejectedRow,
  ImportRow,
  ListContactsOptions,
  UpdateContactInput,
} from "./contact.types.js";
const DUPLICATE_CONTACT_MESSAGE =
  "Contact with this email or phone already exists.";
const DUPLICATE_EMAIL_IN_CSV_MESSAGE = "Duplicate email in CSV";
const DUPLICATE_PHONE_IN_CSV_MESSAGE = "Duplicate phone in CSV";
const MISSING_EMAIL_OR_PHONE_MESSAGE = "Either email or phone is required";
const CONTACT_NOT_FOUND_MESSAGE = "Contact not found";

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  if (/[eE]/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return String(Math.trunc(numeric));
    }
  }

  return trimmed.replace(/\D/g, "");
}

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

  async prepareImport(
    accountId: string,
    parsedRows: ParsedCsvRow[],
  ): Promise<ImportPlan> {
    const readyToImport: ImportRow[] = [];
    const duplicateInDatabase: ImportRejectedRow[] = [];
    const duplicateInCsv: ImportRejectedRow[] = [];
    const invalidRows: ImportRejectedRow[] = [];
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const csvCandidates: ImportRow[] = [];

    for (const parsedRow of parsedRows) {
      const row = this.normalizeImportRow(parsedRow);

      if (!row.email && !row.phone) {
        invalidRows.push({
          ...row,
          reason: MISSING_EMAIL_OR_PHONE_MESSAGE,
        });
        continue;
      }

      let csvDuplicateReason: string | null = null;

      if (row.email && seenEmails.has(row.email)) {
        csvDuplicateReason = DUPLICATE_EMAIL_IN_CSV_MESSAGE;
      } else if (row.phone && seenPhones.has(row.phone)) {
        csvDuplicateReason = DUPLICATE_PHONE_IN_CSV_MESSAGE;
      }

      if (csvDuplicateReason) {
        duplicateInCsv.push({
          ...row,
          reason: csvDuplicateReason,
        });
        continue;
      }

      if (row.email) {
        seenEmails.add(row.email);
      }
      if (row.phone) {
        seenPhones.add(row.phone);
      }

      csvCandidates.push(row);
    }

    for (const row of csvCandidates) {
      const duplicateLookup: { email?: string; phone?: string } = {};
      if (row.email) {
        duplicateLookup.email = row.email;
      }
      if (row.phone) {
        duplicateLookup.phone = row.phone;
      }

      const duplicateField = await this.findDuplicateContact(
        accountId,
        duplicateLookup,
      );

      if (duplicateField === "email") {
        duplicateInDatabase.push({
          ...row,
          reason: "Contact with this email already exists",
        });
        continue;
      }

      if (duplicateField === "phone") {
        duplicateInDatabase.push({
          ...row,
          reason: "Contact with this phone already exists",
        });
        continue;
      }

      readyToImport.push(row);
    }

    return {
      readyToImport,
      duplicateInDatabase,
      duplicateInCsv,
      invalidRows,
    };
  }

  async executeImport(
    accountId: string,
    importPlan: ImportPlan,
  ): Promise<string[]> {
    const { readyToImport } = importPlan;

    if (readyToImport.length === 0) {
      return [];
    }

    return runTransaction(async (tx) => {
      const contactRepository = new ContactRepository(tx);
      const contacts = await contactRepository.createMany(
        accountId,
        readyToImport.map((row) => this.toImportContactInput(row)),
      );

      return contacts.map((contact) => contact.id);
    });
  }

  async getContact(
    accountId: string,    contactId: string,
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
      const phoneSearch = normalizePhone(search);
      if (phoneSearch) {
        options.phoneSearch = phoneSearch;
      }
    }

    return options;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toImportContactInput(row: ImportRow): CreateContactInput {    const data: CreateContactInput = {
      name: row.name,
    };

    if (row.email) {
      data.email = row.email;
    }
    if (row.phone) {
      data.phone = row.phone;
    }
    if (row.city) {
      data.customFields = { city: row.city };
    }

    return data;
  }

  private normalizeImportRow(row: ParsedCsvRow): ImportRow {
    return {      rowNumber: row.rowNumber,
      name: row.name.trim(),
      email: row.email ? this.normalizeEmail(row.email) : "",
      phone: row.phone ? normalizePhone(row.phone) : "",
      city: row.city.trim(),
      tags: row.tags,
    };
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
      data.phone = normalizePhone(input.phone);
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
      data.phone = input.phone ? normalizePhone(input.phone) : input.phone;
    }
    if (input.customFields !== undefined) {
      data.customFields = input.customFields;
    }

    return data;
  }

  private async findDuplicateContact(
    accountId: string,
    data: { email?: string; phone?: string },
    excludeContactId?: string,
  ): Promise<"email" | "phone" | null> {
    if (data.email) {
      const existing = await this.contactRepository.findByEmail(
        accountId,
        data.email,
      );
      if (existing && existing.id !== excludeContactId) {
        return "email";
      }
    }

    if (data.phone) {
      const existing = await this.contactRepository.findByPhone(
        accountId,
        data.phone,
      );
      if (existing && existing.id !== excludeContactId) {
        return "phone";
      }
    }

    return null;
  }

  private async assertNoDuplicate(
    accountId: string,
    data: { email?: string; phone?: string },
    excludeContactId?: string,
  ): Promise<void> {
    const duplicateField = await this.findDuplicateContact(
      accountId,
      data,
      excludeContactId,
    );

    if (duplicateField) {
      throw new AppError(DUPLICATE_CONTACT_MESSAGE, 409);
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
