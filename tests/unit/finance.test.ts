import { describe, expect, it } from "vitest";
import { calculateFinancialSummary } from "@/modules/dashboard/calculations";

describe("financial summary", () => {
  it("keeps competence, cash and receivables separate", () => {
    const result = calculateFinancialSummary(
      [
        { priceCents: 18000, status: "COMPLETED", payments: [{ amountCents: 5000, status: "RECEIVED" }] },
        { priceCents: 22000, status: "CONFIRMED", payments: [] },
        { priceCents: 10000, status: "CANCELED", payments: [] },
      ],
      [{ amountCents: 5000 }],
      [{ amountCents: 8500, status: "PAID" }, { amountCents: 3000, status: "PENDING" }],
      [{ amountCents: 8500, status: "PAID" }],
    );

    expect(result.revenueCents).toBe(18000);
    expect(result.receivedCents).toBe(5000);
    expect(result.receivableCents).toBe(35000);
    expect(result.accruedExpensesCents).toBe(11500);
    expect(result.paidExpensesCents).toBe(8500);
    expect(result.competenceProfitCents).toBe(6500);
    expect(result.cashResultCents).toBe(-3500);
    expect(result.averageTicketCents).toBe(18000);
  });
});
