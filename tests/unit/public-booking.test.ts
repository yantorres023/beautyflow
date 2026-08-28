import { describe, expect, it } from "vitest";
import { publicBookingSchema, publicBookingTokenSchema } from "@/modules/public-booking/schemas";
import { createPublicBookingToken, hashPublicBookingToken } from "@/modules/public-booking/tokens";

const validBooking = {
  organizationSlug: "studio-marina-abc123",
  name: "Ana Souza",
  phone: "11999990000",
  email: "ana@example.com",
  serviceId: "123e4567-e89b-12d3-a456-426614174000",
  date: "2026-09-15",
  time: "14:00",
  notes: "Tenho preferência por uma produção leve.",
};

describe("public booking schema", () => {
  it("accepts a complete booking request", () => {
    expect(publicBookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("requires a contact phone and service", () => {
    const result = publicBookingSchema.safeParse({ ...validBooking, phone: "", serviceId: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone).toBeDefined();
      expect(result.error.flatten().fieldErrors.serviceId).toBeDefined();
    }
  });

  it("creates a private status token that is stored as a hash", () => {
    const token = createPublicBookingToken();

    expect(publicBookingTokenSchema.safeParse(token).success).toBe(true);
    expect(hashPublicBookingToken(token)).toHaveLength(64);
    expect(hashPublicBookingToken(token)).not.toBe(token);
    expect(hashPublicBookingToken(token)).toBe(hashPublicBookingToken(token));
  });
});
