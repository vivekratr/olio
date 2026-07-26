import { Router } from "express";
import { APP_NAME, API_VERSION } from "../common/config/constants.js";
import { successResponse } from "../common/responses/api-response.js";
import analyticsRoutes from "../modules/analytics/index.js";
import audienceRoutes from "../modules/audiences/index.js";
import authRoutes from "../modules/auth/index.js";
import campaignRoutes from "../modules/campaigns/index.js";
import contactRoutes from "../modules/contacts/index.js";
import tagRoutes from "../modules/tags/index.js";
import webhookRoutes from "../modules/webhooks/index.js";

const router: Router = Router();

router.get("/health", (_req, res) => {
  successResponse(
    res,
    {
      name: APP_NAME,
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    "API Healthy",
  );
});

router.use("/auth", authRoutes);
router.use("/contacts", contactRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/audiences", audienceRoutes);
router.use("/tags", tagRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/webhooks", webhookRoutes);

export default router;
