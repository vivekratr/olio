import { ContactController } from "./contact.controller.js";
import { ContactRepository } from "./contact.repository.js";
import { createContactRoutes } from "./contact.routes.js";
import { ContactService } from "./contact.service.js";
import { CsvService } from "./csv.service.js";
import { ContactTagRepository } from "../tags/contact-tag.repository.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";

const contactRepository = new ContactRepository();
const contactService = new ContactService(contactRepository);
const csvService = new CsvService();
const tagService = new TagService(
  new TagRepository(),
  new ContactRepository(),
  new ContactTagRepository(),
);
const contactController = new ContactController(
  contactService,
  csvService,
  tagService,
);

export default createContactRoutes(contactController);
