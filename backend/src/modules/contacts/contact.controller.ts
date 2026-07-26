import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { CsvService } from "./csv.service.js";
import type { ContactService } from "./contact.service.js";
import type { ListContactsQuery } from "./contact.schema.js";
import type { TagService } from "../tags/tag.service.js";
import type {
  CreateContactInput,
  ImportRejectedRow,
  ImportRow,
  UpdateContactInput,
} from "./contact.types.js";

const MISSING_EMAIL_OR_PHONE_MESSAGE = "Either email or phone is required";
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly csvService: CsvService,
    private readonly tagService: TagService,
  ) {}
  create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.user.accountId;
    const input = req.body as CreateContactInput;
    const data = await this.contactService.createContact(accountId, input);
    await syncContactTagsFromCustomFields(
      accountId,
      data.id,
      input.customFields,
      this.tagService,
    );
    const contact = await this.contactService.getContact(accountId, data.id);
    successResponse(res, contact, "Contact created successfully", 201);
  });

  getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.contactService.getContact(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Contact retrieved successfully");
  });

  list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.contactService.listContacts(
      req.user.accountId,
      req.validatedQuery as ListContactsQuery,
    );
    successResponse(res, data, "Contacts retrieved successfully");
  });

  update: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.user.accountId;
    const contactId = req.params.id as string;
    const input = req.body as UpdateContactInput;
    const data = await this.contactService.updateContact(
      accountId,
      contactId,
      input,
    );
    if (input.customFields !== undefined) {
      await syncContactTagsFromCustomFields(
        accountId,
        contactId,
        input.customFields,
        this.tagService,
      );
    }
    const contact = await this.contactService.getContact(accountId, contactId);
    successResponse(res, contact, "Contact updated successfully");
  });

  delete: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.contactService.deleteContact(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Contact deleted successfully");
  });

  importCsv: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("CSV file is required", 400);
    }

    const accountId = req.user.accountId;
    const { parsedRows, invalidRows: csvInvalidRows } =
      await this.csvService.parse(req.file.buffer);
    const importPlan = await this.contactService.prepareImport(
      accountId,
      parsedRows,
    );
    const importedIds = await this.contactService.executeImport(
      accountId,
      importPlan,
    );

    await applyCsvRowTags(
      accountId,
      importedIds,
      importPlan.readyToImport,
      this.tagService,
    );

    const tagIds = parseTagIds(req.body.tagIds);
    if (tagIds.length > 0 && importedIds.length > 0) {
      await Promise.all(
        tagIds.map((tagId) =>
          this.tagService.addContactsToTag(accountId, tagId, importedIds),
        ),
      );
    }

    const csvInvalid: ImportRejectedRow[] = csvInvalidRows.map((row) => ({
      ...row,
      reason: MISSING_EMAIL_OR_PHONE_MESSAGE,
    }));

    successResponse(
      res,
      {
        imported: importedIds.length,
        contactIds: importedIds,
        duplicates: [
          ...importPlan.duplicateInCsv,
          ...importPlan.duplicateInDatabase,
        ],
        invalid: [...csvInvalid, ...importPlan.invalidRows],
      },
      "Contacts imported successfully",
    );
  });
}

async function syncContactTagsFromCustomFields(
  accountId: string,
  contactId: string,
  customFields: Record<string, unknown> | undefined,
  tagService: TagService,
): Promise<void> {
  if (!customFields || !("tags" in customFields)) {
    return;
  }

  const tagNames = parseTagNames(customFields.tags);
  const tags = await tagService.findOrCreateByNames(accountId, tagNames);
  await tagService.replaceTags(
    accountId,
    contactId,
    tags.map((tag) => tag.id),
  );
}

function parseTagNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

async function applyCsvRowTags(
  accountId: string,
  importedIds: string[],
  rows: ImportRow[],
  tagService: TagService,
): Promise<void> {
  await Promise.all(
    importedIds.map(async (contactId, index) => {
      const tagNames = rows[index]?.tags ?? [];
      if (tagNames.length === 0) {
        return;
      }

      const tags = await tagService.findOrCreateByNames(accountId, tagNames);
      if (tags.length === 0) {
        return;
      }

      await tagService.assignTags(
        accountId,
        contactId,
        tags.map((tag) => tag.id),
      );
    }),
  );
}

function parseTagIds(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}