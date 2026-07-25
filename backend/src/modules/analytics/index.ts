import { CampaignRepository } from "../campaigns/campaign.repository.js";
import { AnalyticsController } from "./analytics.controller.js";
import { createAnalyticsRoutes } from "./analytics.routes.js";
import { AnalyticsRepository } from "./analytics.repository.js";
import { AnalyticsService } from "./analytics.service.js";

const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  new CampaignRepository(),
);
const analyticsController = new AnalyticsController(analyticsService);

export default createAnalyticsRoutes(analyticsController);
