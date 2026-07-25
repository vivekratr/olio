import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { ContactService } from "./contact.service.js";
import type { ListContactsQuery } from "./contact.schema.js";
import type { CreateContactInput, UpdateContactInput } from "./contact.types.js";

export class ContactController {
  constructor(private readonly contactService: ContactService) {}

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
}
