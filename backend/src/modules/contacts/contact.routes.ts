import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { ContactController } from "./contact.controller.js";
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from "./contact.schema.js";

export const createContactRoutes = (
  contactController: ContactController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    validate(listContactsQuerySchema, "query"),
    contactController.list,
  );
  router.get("/:id", contactController.getById);
  router.post("/", validate(createContactSchema), contactController.create);
  router.put("/:id", validate(updateContactSchema), contactController.update);
  router.delete("/:id", contactController.delete);

  return router;
};
