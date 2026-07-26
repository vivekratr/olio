import { ContactRepository } from "../contacts/contact.repository.js";
import { AudienceController } from "./audience.controller.js";
import { AudienceRepository } from "./audience.repository.js";
import { createAudienceRoutes } from "./audience.routes.js";
import { AudienceService } from "./audience.service.js";

const audienceService = new AudienceService(
  new AudienceRepository(),
  new ContactRepository(),
);
const audienceController = new AudienceController(audienceService);

export default createAudienceRoutes(audienceController);
