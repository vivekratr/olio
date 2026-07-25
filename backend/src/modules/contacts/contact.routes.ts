import multer from "multer";
import { Router } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { ContactController } from "./contact.controller.js";
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from "./contact.schema.js";

const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (isCsv) {
      cb(null, true);
      return;
    }

    cb(new AppError("Only CSV files are allowed", 400));
  },
});

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
  router.post(
    "/import",
    csvUpload.single("file"),
    contactController.importCsv,
  );
  router.get("/:id", contactController.getById);
  router.post("/", validate(createContactSchema), contactController.create);
  router.put("/:id", validate(updateContactSchema), contactController.update);
  router.delete("/:id", contactController.delete);

  return router;
};
