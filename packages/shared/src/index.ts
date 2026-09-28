import { z } from "zod";

export const reservationStatuses = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
  "CLOSED",
] as const;

export const reservationStatusSchema = z.enum(reservationStatuses);
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Enter a valid phone number")
  .max(20)
  .regex(/^[+()\d\s-]+$/, "Enter a valid phone number");

export const reservationInputSchema = z.object({
  roomTypeId: z.string().cuid(),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: phoneSchema,
  moveInDate: z.coerce.date().refine((date) => date > new Date(Date.now() - 86_400_000), {
    message: "Move-in date must be today or later",
  }),
  stayMonths: z.coerce.number().int().min(1).max(36),
  occupation: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true, { error: "Consent is required" }),
  website: z.string().max(0).optional(),
});
export type ReservationInput = z.input<typeof reservationInputSchema>;

export const contactInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.preprocess((value) => value === "" ? undefined : value, phoneSchema.optional()),
  message: z.string().trim().min(10).max(1200),
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
});

export const statusUpdateSchema = z.object({
  status: reservationStatusSchema,
  note: z.string().trim().max(500).optional(),
});

export const roomInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
  description: z.string().trim().min(20).max(800),
  monthlyPrice: z.coerce.number().int().positive(),
  deposit: z.coerce.number().int().nonnegative(),
  totalUnits: z.coerce.number().int().nonnegative(),
  availableUnits: z.coerce.number().int().nonnegative(),
  capacity: z.coerce.number().int().min(1).max(4),
  imageUrl: z.string().url(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const contentTypes = ["amenities", "gallery", "meal-plans", "testimonials", "faqs"] as const;
export const contentTypeSchema = z.enum(contentTypes);
export type ContentType = z.infer<typeof contentTypeSchema>;

export interface RoomDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  deposit: number;
  capacity: number;
  totalUnits: number;
  availableUnits: number;
  imageUrl: string;
  featured: boolean;
  active: boolean;
}

export interface PublicSiteDto {
  property: {
    name: string;
    tagline: string;
    description: string;
    story: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    whatsapp: string;
    mapUrl: string;
    heroImageUrl: string;
  };
  rooms: RoomDto[];
  amenities: Array<{ id: string; name: string; description: string; icon: string }>;
  gallery: Array<{ id: string; title: string; imageUrl: string; alt: string }>;
  mealPlans: Array<{ id: string; name: string; description: string; days: string }>;
  testimonials: Array<{ id: string; quote: string; author: string; role: string }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
}

export interface ReservationDto {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  moveInDate: string;
  stayMonths: number;
  occupation: string | null;
  message: string | null;
  status: ReservationStatus;
  adminNotes: string | null;
  createdAt: string;
  roomType: Pick<RoomDto, "id" | "name" | "monthlyPrice">;
  history: Array<{ id: string; fromStatus: ReservationStatus | null; toStatus: ReservationStatus; note: string | null; createdAt: string }>;
}

export interface ContactMessageDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  handledAt: string | null;
}

export interface ApiErrorShape {
  error: { code: string; message: string; requestId?: string; fieldErrors?: Record<string, string[]> };
}
