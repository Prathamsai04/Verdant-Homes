import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db.js";
import { AppError } from "./errors.js";
import { isProduction } from "./config.js";

const COOKIE_NAME = "verdant_admin";
const SESSION_MS = 8 * 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string, request: Request, response: Response) {
  const token = crypto.randomBytes(32).toString("base64url");
  const csrfToken = crypto.randomBytes(24).toString("base64url");
  await prisma.adminSession.deleteMany({ where: { OR: [{ adminId }, { expiresAt: { lt: new Date() } }] } });
  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash: hashToken(token),
      csrfToken,
      expiresAt: new Date(Date.now() + SESSION_MS),
      ipAddress: request.ip ?? null,
      userAgent: request.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: SESSION_MS,
    path: "/api/v1/admin",
  });
  return csrfToken;
}

export async function requireAdmin(request: Request, response: Response, next: NextFunction) {
  try {
    const token = request.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.admin.active) {
      response.clearCookie(COOKIE_NAME, { path: "/api/v1/admin" });
      throw new AppError(401, "SESSION_EXPIRED", "Your session expired. Sign in again.");
    }
    response.locals.session = session;
    response.locals.admin = session.admin;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireCsrf(request: Request, response: Response, next: NextFunction) {
  const session = response.locals.session as { csrfToken: string };
  const supplied = request.get("x-csrf-token");
  if (!supplied || supplied.length !== session.csrfToken.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(session.csrfToken))) {
    next(new AppError(403, "CSRF_INVALID", "Security token is missing or expired. Refresh and try again."));
    return;
  }
  next();
}

export function requireOwner(_request: Request, response: Response, next: NextFunction) {
  const admin = response.locals.admin as { role?: string };
  if (admin.role !== "OWNER") {
    next(new AppError(403, "FORBIDDEN", "Owner access is required for this action."));
    return;
  }
  next();
}

export async function destroySession(request: Request, response: Response) {
  const token = request.cookies?.[COOKIE_NAME] as string | undefined;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  response.clearCookie(COOKIE_NAME, { path: "/api/v1/admin" });
}
