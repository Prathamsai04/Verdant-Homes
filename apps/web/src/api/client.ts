import type { ApiErrorShape, ContactInput, PublicSiteDto, ReservationInput } from "@verdant/shared";
import { demoSite } from "./demo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const USE_DEMO_DATA = import.meta.env.VITE_USE_DEMO_DATA === "true";
let csrfToken = "";

export class ApiError extends Error {
  constructor(
    message: string,
    public code = "REQUEST_FAILED",
    public fieldErrors?: Record<string, string[]>,
    public status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");
  if (csrfToken && path.startsWith("/admin") && init?.method && init.method !== "GET") headers.set("x-csrf-token", csrfToken);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorShape | null;
    const error = new ApiError(data?.error.message ?? "The request could not be completed.", data?.error.code, data?.error.fieldErrors, response.status);
    if (path.startsWith("/admin") && response.status === 401) {
      csrfToken = "";
      window.dispatchEvent(new Event("verdant:session-expired"));
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getSite(): Promise<PublicSiteDto> {
  try {
    return await request<PublicSiteDto>("/public/site");
  } catch (error) {
    if (USE_DEMO_DATA) return demoSite;
    throw error;
  }
}

export const submitReservation = (input: ReservationInput) =>
  request<{ reference: string; message: string }>("/public/reservations", { method: "POST", body: JSON.stringify(input) });

export const submitContact = (input: ContactInput) =>
  request<{ message: string }>("/public/contact", { method: "POST", body: JSON.stringify(input) });

export async function login(input: { email: string; password: string }) {
  const data = await request<{ user: AdminUser; csrfToken: string }>("/admin/auth/login", { method: "POST", body: JSON.stringify(input) });
  csrfToken = data.csrfToken;
  return data.user;
}

export async function currentAdmin() {
  const data = await request<{ user: AdminUser; csrfToken: string }>("/admin/auth/me");
  csrfToken = data.csrfToken;
  return data.user;
}

export async function logout() {
  await request<void>("/admin/auth/logout", { method: "POST" });
  csrfToken = "";
}

export const adminRequest = request;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER";
}
