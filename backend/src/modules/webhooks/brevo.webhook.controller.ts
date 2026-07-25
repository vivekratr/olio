import type { RequestHandler, Response } from "express";

import { asyncHandler } from "../../common/utils/async-handler.js";
import type { BrevoWebhookPayload } from "./brevo.webhook.schema.js";
import type { BrevoWebhookService } from "./brevo.webhook.service.js";

export class BrevoWebhookController {
  constructor(private readonly webhookService: BrevoWebhookService) {}

  handle: RequestHandler = asyncHandler(async (req, res: Response) => {
    await this.webhookService.handleEvent(req.body as BrevoWebhookPayload);
    res.sendStatus(200);
  });
}
