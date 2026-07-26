import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { TagController } from "./tag.controller.js";
import {
  createTagSchema,
  tagContactsSchema,
  updateTagSchema,
} from "./tag.schema.js";

export const createTagRoutes = (tagController: TagController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get("/", tagController.list);
  router.post("/", validate(createTagSchema), tagController.create);
  router.patch("/:id", validate(updateTagSchema), tagController.update);
  router.delete("/:id", tagController.delete);
  router.post(
    "/:id/contacts",
    validate(tagContactsSchema),
    tagController.addContacts,
  );
  router.delete(
    "/:id/contacts/:contactId",
    tagController.removeContact,
  );

  return router;
};
