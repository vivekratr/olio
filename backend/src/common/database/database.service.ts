import { prisma } from "./prism.js";


export class DatabaseService {
    transaction = prisma.$transaction.bind(prisma);

}

export const databaseService = new DatabaseService();