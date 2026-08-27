"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { parseMoneyToCents } from "@/lib/money";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const expenseSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição.").max(200),
  category: z.string().trim().min(2, "Informe a categoria.").max(80),
  amount: z.string().min(1, "Informe o valor."),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").optional().or(z.literal("")),
});

export async function createExpenseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = expenseSchema.safeParse({
    description: formData.get("description"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return errorState("Revise os dados da despesa.");
  const amountCents = parseMoneyToCents(parsed.data.amount);
  if (!amountCents || amountCents <= 0) return errorState("Informe um valor maior que zero.");
  const context = await requireAuthContext();

  await db.expense.create({
    data: {
      organizationId: context.organization.id,
      description: parsed.data.description,
      category: parsed.data.category,
      amountCents,
      expenseDate: new Date(`${parsed.data.expenseDate}T12:00:00Z`),
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00Z`) : null,
      status: "PENDING",
    },
  });

  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return successState("Despesa registrada como pendente.");
}

const markPaidSchema = z.object({ id: z.string().uuid(), method: z.enum(["PIX", "CASH", "CARD", "TRANSFER", "OTHER"]) });

export async function markExpensePaidAction(formData: FormData) {
  const parsed = markPaidSchema.safeParse({ id: formData.get("id"), method: formData.get("method") });
  if (!parsed.success) return;
  const context = await requireAuthContext();
  await db.expense.updateMany({ where: { id: parsed.data.id, organizationId: context.organization.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date(), method: parsed.data.method } });
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
}

export async function cancelExpenseAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const context = await requireAuthContext();
  await db.expense.updateMany({ where: { id, organizationId: context.organization.id, status: "PENDING" }, data: { status: "CANCELED" } });
  revalidatePath("/despesas");
  revalidatePath("/financeiro");
}
