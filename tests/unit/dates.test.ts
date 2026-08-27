import { describe, expect, it } from "vitest";
import { formatDateOnly, localDateTimeToUtc, toDateInputValue } from "@/lib/dates";

describe("date helpers", () => {
  it("converts a local São Paulo date and time to UTC", () => {
    expect(localDateTimeToUtc("2026-08-26", "10:30").toISOString()).toBe("2026-08-26T13:30:00.000Z");
  });

  it("keeps SQL date values on the calendar date they represent", () => {
    const sqlDate = new Date("2026-08-26T00:00:00.000Z");
    expect(formatDateOnly(sqlDate)).toContain("26 de ago.");
  });

  it("formats timestamps for date inputs in the configured timezone", () => {
    expect(toDateInputValue(new Date("2026-08-26T02:59:59.000Z"))).toBe("2026-08-25");
    expect(toDateInputValue(new Date("2026-08-26T03:00:00.000Z"))).toBe("2026-08-26");
  });
});
