import { PrismaClient } from "../generated/prisma/client.js";
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg(
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  }),
);

export const prisma =
  globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
    log: ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
