"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { stringOrNull } from "@/lib/validation";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da cliente.").max(160),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export async function createClientAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return errorState("Revise os dados da cliente.");
  const context = await requireAuthContext();

  await db.client.create({
    data: {
      organizationId: context.organization.id,
      name: parsed.data.name,
      phone: stringOrNull(parsed.data.phone),
      email: stringOrNull(parsed.data.email),
      notes: stringOrNull(parsed.data.notes),
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/agenda");
  return successState("Cliente adicionada à sua base.");
}

export async function archiveClientAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const context = await requireAuthContext();

  await db.client.updateMany({
    where: { id, organizationId: context.organization.id, archivedAt: null },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/clientes");
  revalidatePath("/agenda");
}
