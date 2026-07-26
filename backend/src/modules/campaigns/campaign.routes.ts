import { Router } from "express";
import multer from "multer";
import { AppError } from "../../common/errors/app-error.js";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { CampaignController } from "./campaign.controller.js";
import {
  createCampaignSchema,
  previewRecipientsSchema,
  scheduleCampaignSchema,
  updateCampaignSchema,
} from "./campaign.schema.js";

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      cb(null, true);
      return;
    }

    cb(new AppError("Only PDF files are allowed", 400));
  },
});

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
  router.post(
    "/:id/attachment",
    pdfUpload.single("file"),
    campaignController.uploadAttachment,
  );
  router.delete("/:id/attachment", campaignController.deleteAttachment);
  router.get("/:id", campaignController.getById);
  router.patch(
    "/:id",
    validate(updateCampaignSchema),
    campaignController.update,
  );
  router.delete("/:id", campaignController.delete);

  return router;
};
