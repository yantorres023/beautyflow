import { describe, expect, it } from "vitest";
import { intervalsOverlap } from "@/modules/appointments/overlap";

describe("appointment intervals", () => {
  const at = (time: string) => new Date(`2026-08-26T${time}:00-03:00`);

  it("detects crossing intervals", () => {
    expect(intervalsOverlap(at("10:00"), at("11:30"), at("11:00"), at("12:00"))).toBe(true);
  });

  it("allows adjacent appointments", () => {
    expect(intervalsOverlap(at("10:00"), at("11:00"), at("11:00"), at("12:00"))).toBe(false);
  });
});
