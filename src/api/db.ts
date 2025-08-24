// user\src\api\db.ts

import { PrismaClient } from "nihildbuser/prisma/generated/client";
export const prisma: PrismaClient = new PrismaClient();

export async function startDb() {
  await prisma.$connect();
}
export async function stopDb() {
  await prisma.$disconnect();
}
