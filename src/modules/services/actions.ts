"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { parseMoneyToCents } from "@/lib/money";
import { stringOrNull } from "@/lib/validation";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(160),
  durationMinutes: z.coerce.number().int().min(15, "A duração mínima é de 15 minutos.").max(1440),
  price: z.string().trim().min(1, "Informe o preço."),
  description: z.string().trim().max(2000).optional(),
});

export async function createServiceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
    description: formData.get("description"),
  });

  if (!parsed.success) return errorState("Revise os dados do serviço.");
  const priceCents = parseMoneyToCents(parsed.data.price);
  if (priceCents === null || priceCents <= 0) return errorState("Informe um preço maior que zero.");
  const context = await requireAuthContext();

  await db.service.create({
    data: {
      organizationId: context.organization.id,
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      priceCents,
      description: stringOrNull(parsed.data.description),
    },
  });

  revalidatePath("/servicos");
  revalidatePath("/agenda");
  return successState("Serviço criado com sucesso.");
}

export async function archiveServiceAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const context = await requireAuthContext();

  await db.service.updateMany({
    where: { id, organizationId: context.organization.id, archivedAt: null },
    data: { archivedAt: new Date(), isActive: false },
  });

  revalidatePath("/servicos");
  revalidatePath("/agenda");
}
