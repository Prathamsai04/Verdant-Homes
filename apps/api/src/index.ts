import { createApp } from "./app.js";
import { env } from "./config.js";
import { prisma } from "./db.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`Verdant API listening on ${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, closing server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
