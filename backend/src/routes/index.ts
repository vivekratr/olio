import { Router } from "express";
import { APP_NAME, API_VERSION } from "../common/config/constants.js";
import { successResponse } from "../common/responses/api-response.js";

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

export default router;