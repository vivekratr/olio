import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import type { AnalyticsController } from "./analytics.controller.js";

export const createAnalyticsRoutes = (
  analyticsController: AnalyticsController,
): Router => {
  const router = Router();

  router.use(authenticate);
  router.get("/:id/analytics", analyticsController.getCampaignAnalytics);

  return router;
};
