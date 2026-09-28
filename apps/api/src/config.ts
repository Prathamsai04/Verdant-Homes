import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value, context) => {
      const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
      if (origins.length === 0 || origins.some((origin) => !z.string().url().safeParse(origin).success)) {
        context.addIssue({ code: "custom", message: "WEB_ORIGIN must contain valid comma-separated URLs" });
        return z.NEVER;
      }
      return origins;
    }),
  SESSION_SECRET: z.string().min(32),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
