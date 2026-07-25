import { ContactController } from "./contact.controller.js";
import { ContactRepository } from "./contact.repository.js";
import { createContactRoutes } from "./contact.routes.js";
import { ContactService } from "./contact.service.js";
import { CsvService } from "./csv.service.js";

const contactRepository = new ContactRepository();
const contactService = new ContactService(contactRepository);const csvService = new CsvService();
const contactController = new ContactController(contactService, csvService);

export default createContactRoutes(contactController);
