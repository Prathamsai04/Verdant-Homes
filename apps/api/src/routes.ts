import crypto from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  contactInputSchema,
  contentTypeSchema,
  loginInputSchema,
  reservationInputSchema,
  roomInputSchema,
  statusUpdateSchema,
} from "@verdant/shared";
import { prisma } from "./db.js";
import { AppError } from "./errors.js";
import { createSession, destroySession, requireAdmin, requireCsrf, requireOwner } from "./auth.js";
import { transitionReservation } from "./reservations.js";

const asyncRoute =
  (handler: (request: Request, response: Response) => Promise<unknown>) =>
  (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response).catch(next);
  };

const idSchema = z.string().cuid();
const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["NEW", "CONTACTED", "CONFIRMED", "WAITLISTED", "CANCELLED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const propertyInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(1000),
  story: z.string().trim().min(20).max(2000),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email(),
  whatsapp: z.string().trim().min(8).max(20),
  mapUrl: z.string().url(),
  heroImageUrl: z.string().url(),
});

const contentSchemas = {
  amenities: z.object({ name: z.string().min(2).max(80), description: z.string().min(5).max(300), icon: z.string().min(2).max(40), active: z.boolean().default(true), sortOrder: z.number().int().default(0) }),
  gallery: z.object({ title: z.string().min(2).max(100), imageUrl: z.string().url(), alt: z.string().min(5).max(200), active: z.boolean().default(true), sortOrder: z.number().int().default(0) }),
  "meal-plans": z.object({ name: z.string().min(2).max(80), description: z.string().min(5).max(300), days: z.string().min(2).max(80), active: z.boolean().default(true), sortOrder: z.number().int().default(0) }),
  testimonials: z.object({ quote: z.string().min(10).max(600), author: z.string().min(2).max(80), role: z.string().min(2).max(100), active: z.boolean().default(true), sortOrder: z.number().int().default(0) }),
  faqs: z.object({ question: z.string().min(5).max(200), answer: z.string().min(10).max(1200), active: z.boolean().default(true), sortOrder: z.number().int().default(0) }),
};

function contentDelegate(type: keyof typeof contentSchemas) {
  const delegates = {
    amenities: prisma.amenity,
    gallery: prisma.galleryItem,
    "meal-plans": prisma.mealPlan,
    testimonials: prisma.testimonial,
    faqs: prisma.faq,
  };
  return delegates[type] as any;
}

async function publicSite() {
  const [property, rooms, amenities, gallery, mealPlans, testimonials, faqs] = await Promise.all([
    prisma.property.findFirst(),
    prisma.roomType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.amenity.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.galleryItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.mealPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!property) throw new AppError(503, "NOT_CONFIGURED", "Property content has not been configured.");
  return { property, rooms, amenities, gallery, mealPlans, testimonials, faqs };
}

export const publicRouter = Router();

publicRouter.get("/site", asyncRoute(async (_request, response) => response.json(await publicSite())));
publicRouter.get("/rooms", asyncRoute(async (_request, response) => {
  response.json(await prisma.roomType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }));
}));

const enquiryLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });

publicRouter.post("/reservations", enquiryLimiter, asyncRoute(async (request, response) => {
  const input = reservationInputSchema.parse(request.body);
  if (input.website) throw new AppError(400, "INVALID_SUBMISSION", "Unable to submit this enquiry.");
  const room = await prisma.roomType.findFirst({ where: { id: input.roomTypeId, active: true } });
  if (!room) throw new AppError(404, "ROOM_NOT_FOUND", "That room is no longer available for enquiries.");
  const fingerprint = crypto
    .createHash("sha256")
    .update(`${input.email.toLowerCase()}|${input.roomTypeId}|${input.moveInDate.toISOString().slice(0, 10)}`)
    .digest("hex");
  const fingerprintBucket = `${fingerprint}:${Math.floor(Date.now() / (15 * 60_000))}`;
  const recent = await prisma.reservation.findFirst({
    where: { fingerprint, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } },
  });
  if (recent) {
    response.status(202).json({ reference: recent.reference, message: "We already received this enquiry." });
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          roomTypeId: input.roomTypeId,
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          moveInDate: input.moveInDate,
          stayMonths: input.stayMonths,
          occupation: input.occupation ?? null,
          message: input.message ?? null,
          reference: `VH-${new Date().getFullYear()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
          fingerprint,
          fingerprintBucket,
          history: { create: { toStatus: "NEW", note: "Enquiry submitted online" } },
        },
      });
      response.status(201).json({
        reference: reservation.reference,
        message: "Enquiry received. Our house team will contact you within one business day.",
      });
      return;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const duplicate = await prisma.reservation.findUnique({ where: { fingerprintBucket } });
      if (duplicate) {
        response.status(202).json({ reference: duplicate.reference, message: "We already received this enquiry." });
        return;
      }
      if (attempt === 3) throw error;
    }
  }
}));

publicRouter.post("/contact", enquiryLimiter, asyncRoute(async (request, response) => {
  const input = contactInputSchema.parse(request.body);
  if (input.website) throw new AppError(400, "INVALID_SUBMISSION", "Unable to send this message.");
  await prisma.contactMessage.create({ data: { fullName: input.fullName, email: input.email.toLowerCase(), phone: input.phone ?? null, message: input.message } });
  response.status(201).json({ message: "Message received. We will reply within one business day." });
}));

export const adminRouter = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const dummyHash = "$2b$12$g.1RdlPpdbDeFvIK2ZKzuuFXeywq/I7Q9VFF09GfTS12u7pWyBrXi";

adminRouter.post("/auth/login", loginLimiter, asyncRoute(async (request, response) => {
  const input = loginInputSchema.parse(request.body);
  const admin = await prisma.admin.findUnique({ where: { email: input.email.toLowerCase() } });
  const matches = await bcrypt.compare(input.password, admin?.passwordHash ?? dummyHash);
  if (!admin || !matches || !admin.active) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  const csrfToken = await createSession(admin.id, request, response);
  response.json({ user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }, csrfToken });
}));

adminRouter.use(requireAdmin);
adminRouter.get("/auth/me", asyncRoute(async (_request, response) => {
  const admin = response.locals.admin as { id: string; email: string; name: string; role: string };
  const session = response.locals.session as { csrfToken: string };
  response.json({ user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }, csrfToken: session.csrfToken });
}));
adminRouter.post("/auth/logout", requireCsrf, asyncRoute(async (request, response) => {
  await destroySession(request, response);
  response.status(204).send();
}));

adminRouter.use((request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  requireCsrf(request, response, next);
});

adminRouter.get("/dashboard", asyncRoute(async (_request, response) => {
  const [grouped, rooms, recent] = await Promise.all([
    prisma.reservation.groupBy({ by: ["status"], _count: true }),
    prisma.roomType.findMany({ where: { active: true }, select: { totalUnits: true, availableUnits: true } }),
    prisma.reservation.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { roomType: { select: { name: true } } } }),
  ]);
  const totals = rooms.reduce((acc, room) => ({ units: acc.units + room.totalUnits, available: acc.available + room.availableUnits }), { units: 0, available: 0 });
  response.json({ counts: Object.fromEntries(grouped.map((item) => [item.status, item._count])), inventory: totals, recent });
}));

adminRouter.get("/reservations", asyncRoute(async (request, response) => {
  const query = querySchema.parse(request.query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { OR: [{ fullName: { contains: query.q, mode: "insensitive" as const } }, { email: { contains: query.q, mode: "insensitive" as const } }, { reference: { contains: query.q, mode: "insensitive" as const } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.reservation.findMany({ where, include: { roomType: true, history: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * 25, take: 25 }),
    prisma.reservation.count({ where }),
  ]);
  response.json({ items, total, page: query.page });
}));

adminRouter.get("/messages", asyncRoute(async (request, response) => {
  const page = z.coerce.number().int().min(1).default(1).parse(request.query.page);
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25 }),
    prisma.contactMessage.count(),
  ]);
  response.json({ items, total, page });
}));

adminRouter.patch("/messages/:id", asyncRoute(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const handled = z.boolean().parse(request.body.handled);
  response.json(await prisma.contactMessage.update({
    where: { id },
    data: { handledAt: handled ? new Date() : null },
  }));
}));

adminRouter.patch("/reservations/:id/status", asyncRoute(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const input = statusUpdateSchema.parse(request.body);
  const admin = response.locals.admin as { id: string };
  response.json(await transitionReservation(id, input.status, input.note, admin.id));
}));

adminRouter.get("/rooms", asyncRoute(async (_request, response) => {
  response.json(await prisma.roomType.findMany({ orderBy: { sortOrder: "asc" } }));
}));
adminRouter.post("/rooms", requireOwner, asyncRoute(async (request, response) => {
  const input = roomInputSchema.refine((room) => room.availableUnits <= room.totalUnits, "Available units cannot exceed total units").parse(request.body);
  response.status(201).json(await prisma.roomType.create({ data: input }));
}));
adminRouter.patch("/rooms/:id", requireOwner, asyncRoute(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const input = roomInputSchema.partial().parse(request.body);
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.roomType.findUnique({ where: { id } });
    if (!current) throw new AppError(404, "NOT_FOUND", "Room type not found.");
    const totalUnits = input.totalUnits ?? current.totalUnits;
    const availableUnits = input.availableUnits ?? current.availableUnits;
    if (availableUnits > totalUnits) {
      throw new AppError(400, "INVALID_INVENTORY", "Available units cannot exceed total units.");
    }
    return tx.roomType.update({ where: { id }, data: input as Prisma.RoomTypeUpdateInput });
  });
  response.json(updated);
}));
adminRouter.delete("/rooms/:id", requireOwner, asyncRoute(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  response.json(await prisma.roomType.update({ where: { id }, data: { active: false } }));
}));

adminRouter.get("/property", asyncRoute(async (_request, response) => {
  const property = await prisma.property.findFirst();
  response.json(property);
}));
adminRouter.patch("/property", requireOwner, asyncRoute(async (request, response) => {
  const input = propertyInputSchema.partial().parse(request.body);
  const property = await prisma.property.findFirst();
  if (!property) throw new AppError(404, "NOT_FOUND", "Property profile not found.");
  response.json(await prisma.property.update({ where: { id: property.id }, data: input as Prisma.PropertyUpdateInput }));
}));

adminRouter.get("/content/:type", asyncRoute(async (request, response) => {
  const type = contentTypeSchema.parse(request.params.type);
  response.json(await contentDelegate(type).findMany({ orderBy: { sortOrder: "asc" } }));
}));
adminRouter.post("/content/:type", asyncRoute(async (request, response) => {
  const type = contentTypeSchema.parse(request.params.type);
  const input = contentSchemas[type].parse(request.body);
  response.status(201).json(await contentDelegate(type).create({ data: input }));
}));
adminRouter.patch("/content/:type/:id", asyncRoute(async (request, response) => {
  const type = contentTypeSchema.parse(request.params.type);
  const id = idSchema.parse(request.params.id);
  const input = contentSchemas[type].partial().parse(request.body);
  response.json(await contentDelegate(type).update({ where: { id }, data: input }));
}));
adminRouter.delete("/content/:type/:id", asyncRoute(async (request, response) => {
  const type = contentTypeSchema.parse(request.params.type);
  const id = idSchema.parse(request.params.id);
  response.json(await contentDelegate(type).update({ where: { id }, data: { active: false } }));
}));
