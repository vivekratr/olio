import { Router } from "express";

import { validate } from "../../common/middlewares/validate.middleware.js";
import { CampaignRecipientRepository } from "../campaigns/campaign-recipient.repository.js";
import { BrevoWebhookController } from "./brevo.webhook.controller.js";
import { brevoWebhookSchema } from "./brevo.webhook.schema.js";
import { BrevoWebhookService } from "./brevo.webhook.service.js";
import { CampaignEventRepository } from "./campaign-event.repository.js";

const campaignEventRepository = new CampaignEventRepository();
const campaignRecipientRepository = new CampaignRecipientRepository();
const webhookService = new BrevoWebhookService(
  campaignEventRepository,
  campaignRecipientRepository,
);
const webhookController = new BrevoWebhookController(webhookService);

const router: Router = Router();

router.post("/brevo", validate(brevoWebhookSchema), webhookController.handle);

export default router;
