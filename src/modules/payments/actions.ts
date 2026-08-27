"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { parseMoneyToCents } from "@/lib/money";
import { localDateTimeToUtc } from "@/lib/dates";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const paymentSchema = z.object({
  appointmentId: z.string().uuid("Selecione um atendimento."),
  amount: z.string().min(1, "Informe o valor."),
  type: z.enum(["DEPOSIT", "BALANCE", "OTHER"]),
  method: z.enum(["PIX", "CASH", "CARD", "TRANSFER", "OTHER"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
});

export async function recordPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = paymentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    method: formData.get("method"),
    date: formData.get("date"),
  });

  if (!parsed.success) return errorState("Revise os dados do recebimento.");
  const amountCents = parseMoneyToCents(parsed.data.amount);
  if (!amountCents || amountCents <= 0) return errorState("Informe um valor maior que zero.");
  const context = await requireAuthContext();
  const appointment = await db.appointment.findFirst({
    where: { id: parsed.data.appointmentId, organizationId: context.organization.id, status: { notIn: ["CANCELED", "NO_SHOW"] } },
    include: { payments: { where: { status: "RECEIVED" } } },
  });

  if (!appointment) return errorState("Atendimento não encontrado ou sem saldo disponível.");
  const receivedCents = appointment.payments.reduce((total, payment) => total + payment.amountCents, 0);
  if (amountCents > appointment.priceCents - receivedCents) return errorState("O recebimento não pode ser maior que o saldo do atendimento.");

  await db.payment.create({
    data: {
      organizationId: context.organization.id,
      appointmentId: appointment.id,
      amountCents,
      type: parsed.data.type,
      method: parsed.data.method,
      receivedAt: localDateTimeToUtc(parsed.data.date, "12:00", context.organization.timezone),
    },
  });

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return successState("Pagamento registrado.");
}

export async function voidPaymentAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const context = await requireAuthContext();

  await db.payment.updateMany({ where: { id, organizationId: context.organization.id, status: "RECEIVED" }, data: { status: "VOIDED" } });
  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
}
