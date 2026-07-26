import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { AudienceController } from "./audience.controller.js";
import {
  createAudienceSchema,
  previewAudienceSchema,
  updateAudienceSchema,
} from "./audience.schema.js";

export const createAudienceRoutes = (
  audienceController: AudienceController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get("/", audienceController.list);
  router.post(
    "/preview",
    validate(previewAudienceSchema),
    audienceController.preview,
  );
  router.post("/", validate(createAudienceSchema), audienceController.create);
  router.get("/:id", audienceController.getById);
  router.patch(
    "/:id",
    validate(updateAudienceSchema),
    audienceController.update,
  );
  router.delete("/:id", audienceController.delete);

  return router;
};
