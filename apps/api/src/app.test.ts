import { describe, expect, it, vi } from "vitest";

vi.mock("./config.js", () => ({
  env: { WEB_ORIGIN: "http://localhost:5173", NODE_ENV: "test", PORT: 4000, DATABASE_URL: "postgresql://test", SESSION_SECRET: "12345678901234567890123456789012" },
  isProduction: false,
}));
vi.mock("./db.js", () => ({
  prisma: { $queryRaw: vi.fn(), $disconnect: vi.fn() },
}));

import request from "supertest";
import { createApp } from "./app.js";

describe("service health", () => {
  it("returns a request id and health response", async () => {
    const response = await request(createApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });
});
