import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { CsvService } from "./csv.service.js";
import type { ContactService } from "./contact.service.js";
import type { ListContactsQuery } from "./contact.schema.js";
import type {
  CreateContactInput,
  ImportRejectedRow,
  UpdateContactInput,
} from "./contact.types.js";

const MISSING_EMAIL_OR_PHONE_MESSAGE = "Either email or phone is required";
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly csvService: CsvService,
  ) {}
  create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.contactService.createContact(
      req.user.accountId,
      req.body as CreateContactInput,
    );
    successResponse(res, data, "Contact created successfully", 201);
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
      req.query as unknown as ListContactsQuery,
    );
    successResponse(res, data, "Contacts retrieved successfully");
  });

  update: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.contactService.updateContact(
      req.user.accountId,
      req.params.id as string,
      req.body as UpdateContactInput,
    );
    successResponse(res, data, "Contact updated successfully");
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
    const imported = await this.contactService.executeImport(
      accountId,
      importPlan,
    );

    const csvInvalid: ImportRejectedRow[] = csvInvalidRows.map((row) => ({
      ...row,
      reason: MISSING_EMAIL_OR_PHONE_MESSAGE,
    }));

    successResponse(
      res,
      {
        imported,
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