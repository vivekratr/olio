import { prisma } from "./prisma.js";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export abstract class BaseRepository {
  protected readonly prisma: DbClient;

  constructor(client: DbClient = prisma) {
    this.prisma = client;
  }
}

export const runTransaction = <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => prisma.$transaction(fn);
