import { describe, expect, it } from "vitest";
import { formatCurrency, parseMoneyToCents } from "@/lib/money";

describe("money helpers", () => {
  it("parses Brazilian currency input into cents", () => {
    expect(parseMoneyToCents("1.234,56")).toBe(123456);
    expect(parseMoneyToCents("180,00")).toBe(18000);
    expect(parseMoneyToCents("R$ 50,10")).toBe(5010);
  });

  it("rejects invalid or negative amounts", () => {
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("-1,00")).toBeNull();
  });

  it("formats cents as BRL", () => {
    expect(formatCurrency(123456)).toBe("R$ 1.234,56");
  });
});
