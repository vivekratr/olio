import { ContactRepository } from "../contacts/contact.repository.js";
import { ContactTagRepository } from "./contact-tag.repository.js";
import { TagController } from "./tag.controller.js";
import { TagRepository } from "./tag.repository.js";
import { createTagRoutes } from "./tag.routes.js";
import { TagService } from "./tag.service.js";

const tagService = new TagService(
  new TagRepository(),
  new ContactRepository(),
  new ContactTagRepository(),
);
const tagController = new TagController(tagService);

export default createTagRoutes(tagController);
