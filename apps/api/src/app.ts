import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { rateLimit } from "express-rate-limit";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { errorHandler } from "./errors.js";
import { adminRouter, publicRouter } from "./routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY_HOPS > 0) app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use(
    pinoHttp({
      genReqId(request, response) {
        const id = request.headers["x-request-id"]?.toString().slice(0, 100) ?? crypto.randomUUID();
        response.setHeader("x-request-id", id);
        return id;
      },
      redact: ["req.headers.cookie", "req.body.password", "res.headers.set-cookie"],
    }),
  );
  app.use((request, response, next) => {
    response.locals.requestId = request.id;
    next();
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));

  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/ready", async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: "ready" });
    } catch {
      response.status(503).json({ status: "not_ready" });
    }
  });
  app.use("/api/v1/public", publicRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use((_request, response) => response.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } }));
  app.use(errorHandler);
  return app;
}
