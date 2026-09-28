import { describe, expect, it } from "vitest";
import { reservationInputSchema, statusUpdateSchema } from "./index.js";

describe("reservation contracts", () => {
  it("accepts a complete future enquiry", () => {
    const result = reservationInputSchema.safeParse({
      roomTypeId: "cm12345678901234567890123",
      fullName: "Ananya Rao",
      email: "ananya@example.com",
      phone: "+91 98765 43210",
      moveInDate: new Date(Date.now() + 86_400_000).toISOString(),
      stayMonths: 6,
      consent: true,
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported lifecycle states", () => {
    expect(statusUpdateSchema.safeParse({ status: "PAID" }).success).toBe(false);
  });
});
