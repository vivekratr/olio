import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import type { AuthController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  router.post("/register", validate(registerSchema), authController.register);
  router.post("/login", validate(loginSchema), authController.login);
  router.get("/me", authenticate, authController.me);

  return router;
};
