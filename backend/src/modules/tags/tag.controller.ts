import type { Request, RequestHandler, Response } from "express";
import { successResponse } from "../../common/responses/api-response.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import type { TagContactsInput } from "./tag.schema.js";
import type { TagService } from "./tag.service.js";
import type { CreateTagInput, UpdateTagInput } from "./tag.types.js";

export class TagController {
  constructor(private readonly tagService: TagService) {}

  list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.tagService.listTags(req.user.accountId);
    successResponse(res, data, "Tags retrieved successfully");
  });

  create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.tagService.createTag(
      req.user.accountId,
      req.body as CreateTagInput,
    );
    successResponse(res, data, "Tag created successfully", 201);
  });

  update: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.tagService.updateTag(
      req.user.accountId,
      req.params.id as string,
      req.body as UpdateTagInput,
    );
    successResponse(res, data, "Tag updated successfully");
  });

  delete: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.tagService.deleteTag(
      req.user.accountId,
      req.params.id as string,
    );
    successResponse(res, data, "Tag deleted successfully");
  });

  addContacts: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const data = await this.tagService.addContactsToTag(
        req.user.accountId,
        req.params.id as string,
        (req.body as TagContactsInput).contactIds,
      );
      successResponse(res, data, "Contacts added to tag successfully");
    },
  );

  removeContact: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      await this.tagService.removeContactFromTag(
        req.user.accountId,
        req.params.id as string,
        req.params.contactId as string,
      );
      successResponse(res, null, "Contact removed from tag successfully");
    },
  );
}
