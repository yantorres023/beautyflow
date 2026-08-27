import { addDays, getCurrentMonthRange } from "@/lib/dates";
import { db } from "@/server/db";
import { calculateFinancialSummary } from "@/modules/dashboard/calculations";

export type DashboardSummary = {
  revenueCents: number;
  receivedCents: number;
  receivableCents: number;
  accruedExpensesCents: number;
  paidExpensesCents: number;
  competenceProfitCents: number;
  cashResultCents: number;
  averageTicketCents: number;
  completedCount: number;
  pendingExpensesCents: number;
  upcoming: Array<{
    id: string;
    startsAt: Date;
    clientName: string;
    serviceName: string;
    priceCents: number;
    status: string;
  }>;
  bars: Array<{ label: string; revenueCents: number; expenseCents: number }>;
};

export async function getDashboardSummary(organizationId: string, from?: Date, to?: Date): Promise<DashboardSummary> {
  const defaultRange = getCurrentMonthRange();
  const rangeFrom = from ?? defaultRange.from;
  const rangeTo = to ?? defaultRange.to;
  const [appointments, payments, accruedExpenses, paidExpenses, pendingExpenses, upcoming] = await Promise.all([
    db.appointment.findMany({
      where: { organizationId, startsAt: { gte: rangeFrom, lt: rangeTo } },
      include: { payments: { where: { status: "RECEIVED" } } },
    }),
    db.payment.findMany({ where: { organizationId, status: "RECEIVED", receivedAt: { gte: rangeFrom, lt: rangeTo } } }),
    db.expense.findMany({ where: { organizationId, status: { not: "CANCELED" }, expenseDate: { gte: rangeFrom, lt: rangeTo } } }),
    db.expense.findMany({ where: { organizationId, status: "PAID", paidAt: { gte: rangeFrom, lt: rangeTo } } }),
    db.expense.aggregate({ where: { organizationId, status: "PENDING" }, _sum: { amountCents: true } }),
    db.appointment.findMany({
      where: { organizationId, status: { in: ["SCHEDULED", "CONFIRMED"] }, startsAt: { gte: new Date(), lt: addDays(new Date(), 14) } },
      include: { client: true, service: true },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
  ]);

  const financial = calculateFinancialSummary(appointments, payments, accruedExpenses, paidExpenses);

  const bars = Array.from({ length: 4 }, (_, index) => {
    const bucketFrom = new Date(rangeFrom.getTime() + index * ((rangeTo.getTime() - rangeFrom.getTime()) / 4));
    const bucketTo = index === 3 ? rangeTo : new Date(rangeFrom.getTime() + (index + 1) * ((rangeTo.getTime() - rangeFrom.getTime()) / 4));
    return {
      label: `Sem ${index + 1}`,
      revenueCents: appointments.filter((appointment) => appointment.status === "COMPLETED" && appointment.startsAt >= bucketFrom && appointment.startsAt < bucketTo).reduce((sum, appointment) => sum + appointment.priceCents, 0),
      expenseCents: accruedExpenses.filter((expense) => expense.expenseDate >= bucketFrom && expense.expenseDate < bucketTo).reduce((sum, expense) => sum + expense.amountCents, 0),
    };
  });

  return {
    ...financial,
    pendingExpensesCents: pendingExpenses._sum.amountCents ?? 0,
    upcoming: upcoming.map((appointment) => ({ id: appointment.id, startsAt: appointment.startsAt, clientName: appointment.client.name, serviceName: appointment.service.name, priceCents: appointment.priceCents, status: appointment.status })),
    bars,
  };
}
