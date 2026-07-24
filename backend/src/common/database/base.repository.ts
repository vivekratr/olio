import { prisma } from "./prisma.js";

export abstract class BaseRepository {
  protected readonly prisma = prisma;
}
