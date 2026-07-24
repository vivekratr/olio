import {prisma} from "./prism.js"

export abstract class BaseRepository {
    protected readonly prisma = prisma;
    
    protected constructor(
        protected readonly accountId?: string
    ) {}
}