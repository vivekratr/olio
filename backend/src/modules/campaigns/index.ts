import { BrevoProvider } from "../../infrastructure/email/brevo.provider.js";
import { CampaignQueue } from "../../infrastructure/queue/campaign.queue.js";
import { AnalyticsRepository } from "../analytics/analytics.repository.js";
import { AnalyticsService } from "../analytics/analytics.service.js";
import { AudienceRepository } from "../audiences/audience.repository.js";
import { AudienceService } from "../audiences/audience.service.js";
import { ContactRepository } from "../contacts/contact.repository.js";
import { ContactTagRepository } from "../tags/contact-tag.repository.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { CampaignController } from "./campaign.controller.js";
import { CampaignRecipientRepository } from "./campaign-recipient.repository.js";
import { CampaignRecipientResolver } from "./campaign-recipient.resolver.js";
import { CampaignRepository } from "./campaign.repository.js";
import { createCampaignRoutes } from "./campaign.routes.js";
import { CampaignScheduler } from "./campaign.scheduler.js";
import { CampaignService } from "./campaign.service.js";

const contactRepository = new ContactRepository();
const campaignRepository = new CampaignRepository();
const tagService = new TagService(
  new TagRepository(),
  contactRepository,
  new ContactTagRepository(),
);
const campaignService = new CampaignService(
  campaignRepository,
  new CampaignRecipientResolver(
    new AudienceService(new AudienceRepository(), contactRepository),
    contactRepository,
  ),
  tagService,
  new CampaignScheduler(),
  new CampaignQueue(),
  new CampaignRecipientRepository(),
  new BrevoProvider(),
);
const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  campaignRepository,
);
const campaignController = new CampaignController(
  campaignService,
  analyticsService,
);

export default createCampaignRoutes(campaignController);
