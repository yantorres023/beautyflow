type AppointmentFinanceInput = {
  priceCents: number;
  status: string;
  payments: Array<{ amountCents: number; status: string }>;
};

type ExpenseFinanceInput = {
  amountCents: number;
  status: string;
};

export function calculateFinancialSummary(appointments: AppointmentFinanceInput[], payments: Array<{ amountCents: number }>, accruedExpenses: ExpenseFinanceInput[], paidExpenses: ExpenseFinanceInput[]) {
  const completed = appointments.filter((appointment) => appointment.status === "COMPLETED");
  const revenueCents = completed.reduce((total, appointment) => total + appointment.priceCents, 0);
  const receivedCents = payments.reduce((total, payment) => total + payment.amountCents, 0);
  const receivableCents = appointments
    .filter((appointment) => ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(appointment.status))
    .reduce((total, appointment) => {
      const received = appointment.payments.filter((payment) => payment.status === "RECEIVED").reduce((sum, payment) => sum + payment.amountCents, 0);
      return total + Math.max(appointment.priceCents - received, 0);
    }, 0);
  const accruedExpensesCents = accruedExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const paidExpensesCents = paidExpenses.reduce((total, expense) => total + expense.amountCents, 0);

  return {
    revenueCents,
    receivedCents,
    receivableCents,
    accruedExpensesCents,
    paidExpensesCents,
    competenceProfitCents: revenueCents - accruedExpensesCents,
    cashResultCents: receivedCents - paidExpensesCents,
    averageTicketCents: completed.length ? Math.round(revenueCents / completed.length) : 0,
    completedCount: completed.length,
  };
}
