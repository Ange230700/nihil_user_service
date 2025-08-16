// user/src/infrastructure/prisma.ts
import { PrismaClient } from "nihildbuser/prisma/generated/client";

declare global {
  var __userPrisma: PrismaClient | undefined;
}

const datasourceUrl = process.env.USER_DATABASE_URL;

export const prisma: PrismaClient =
  globalThis.__userPrisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__userPrisma = prisma;
}
