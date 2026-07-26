import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { CampaignController } from "./campaign.controller.js";
import {
  createCampaignSchema,
  previewRecipientsSchema,
  scheduleCampaignSchema,
  updateCampaignSchema,
} from "./campaign.schema.js";

export const createCampaignRoutes = (
  campaignController: CampaignController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get("/", campaignController.list);
  router.post(
    "/recipients/preview",
    validate(previewRecipientsSchema),
    campaignController.previewRecipients,
  );
  router.post("/", validate(createCampaignSchema), campaignController.create);
  router.get("/:id/analytics", campaignController.getAnalytics);
  router.post("/:id/send", campaignController.send);
  router.post(
    "/:id/schedule",
    validate(scheduleCampaignSchema),
    campaignController.schedule,
  );
  router.get("/:id", campaignController.getById);
  router.patch(
    "/:id",
    validate(updateCampaignSchema),
    campaignController.update,
  );
  router.delete("/:id", campaignController.delete);

  return router;
};
