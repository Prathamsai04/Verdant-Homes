import { describe, expect, it } from "vitest";
import { canTransition } from "./reservations.js";

describe("reservation lifecycle", () => {
  it("allows operational confirmation paths", () => {
    expect(canTransition("CONTACTED", "CONFIRMED")).toBe(true);
    expect(canTransition("WAITLISTED", "CONFIRMED")).toBe(true);
  });

  it("blocks confirmation from a closed enquiry", () => {
    expect(canTransition("CLOSED", "CONFIRMED")).toBe(false);
  });
});
