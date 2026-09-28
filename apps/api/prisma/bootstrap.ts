import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seed } from "./seed.js";

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("ADMIN_EMAIL must be set before database bootstrap.");

  const [admin, property] = await Promise.all([
    prisma.admin.findUnique({ where: { email }, select: { id: true } }),
    prisma.property.findFirst({ select: { id: true } }),
  ]);

  if (admin && property) {
    console.log("Seed data already present; skipping seed.");
    return;
  }

  await seed(prisma);
  console.log("Database bootstrap complete.");
}

bootstrap()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());