import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./common/config/env.js";
import { API_PREFIX } from "./common/config/constants.js";
import { logger } from "./common/logger/logger.js";
import { CampaignQueue } from "./infrastructure/queue/campaign.queue.js";
import { startCampaignWorker } from "./infrastructure/queue/worker.js";
import { AudienceRepository } from "./modules/audiences/audience.repository.js";
import { AudienceService } from "./modules/audiences/audience.service.js";
import { CampaignProcessor } from "./modules/campaigns/campaign.processor.js";
import { CampaignRecipientRepository } from "./modules/campaigns/campaign-recipient.repository.js";
import { CampaignRecipientResolver } from "./modules/campaigns/campaign-recipient.resolver.js";
import { CampaignRepository } from "./modules/campaigns/campaign.repository.js";
import { CampaignScheduler } from "./modules/campaigns/campaign.scheduler.js";
import { CampaignService } from "./modules/campaigns/campaign.service.js";
import { ContactRepository } from "./modules/contacts/contact.repository.js";
import { ContactTagRepository } from "./modules/tags/contact-tag.repository.js";
import { TagRepository } from "./modules/tags/tag.repository.js";
import { TagService } from "./modules/tags/tag.service.js";
import routes from "./routes/index.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import { notFoundMiddleware } from "./common/middlewares/not-found.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(API_PREFIX, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const contactRepository = new ContactRepository();
const campaignService = new CampaignService(
  new CampaignRepository(),
  new CampaignRecipientResolver(
    new AudienceService(new AudienceRepository(), contactRepository),
    contactRepository,
  ),
  new TagService(
    new TagRepository(),
    contactRepository,
    new ContactTagRepository(),
  ),
  new CampaignScheduler(),
  new CampaignQueue(),
  new CampaignRecipientRepository(),
);
const campaignProcessor = new CampaignProcessor(campaignService);

startCampaignWorker(campaignProcessor);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
