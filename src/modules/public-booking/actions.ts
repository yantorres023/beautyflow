"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { localDateTimeToUtc } from "@/lib/dates";
import { stringOrNull } from "@/lib/validation";
import { db } from "@/server/db";
import { publicBookingSchema } from "@/modules/public-booking/schemas";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(([, messages]) => messages?.length),
  ) as Record<string, string[]>;
}

function isConflictError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const details = error as { code?: string; message?: string; meta?: unknown };
  const text = JSON.stringify({ message: details.message, meta: details.meta });
  return details.code === "P2002" || (details.code === "P2004" && /appointments_no_overlap|exclusion constraint/i.test(text));
}

export async function createPublicBookingAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = publicBookingSchema.safeParse({
    organizationSlug: formData.get("organizationSlug"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return errorState("Revise os dados para solicitar seu horário.", fieldErrors(parsed.error));

  const organization = await db.organization.findFirst({
    where: { slug: parsed.data.organizationSlug, archivedAt: null },
    select: { id: true, slug: true, timezone: true },
  });

  if (!organization) return errorState("Este link de agendamento não está disponível.");

  const startsAt = localDateTimeToUtc(parsed.data.date, parsed.data.time, organization.timezone);
  if (Number.isNaN(startsAt.getTime())) return errorState("Informe uma data e horário válidos.");
  if (startsAt.getTime() < Date.now()) return errorState("Escolha um horário futuro.", { date: ["Escolha uma data e horário futuros."] });

  const [service, member] = await Promise.all([
    db.service.findFirst({
      where: { id: parsed.data.serviceId, organizationId: organization.id, archivedAt: null, isActive: true },
      select: { id: true, durationMinutes: true, priceCents: true },
    }),
    db.organizationMember.findFirst({
      where: { organizationId: organization.id, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  if (!service || !member) return errorState("Este espaço ainda não está disponível para agendamentos.");

  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const conflict = await db.appointment.findFirst({
    where: {
      organizationId: organization.id,
      memberId: member.id,
      status: { not: "CANCELED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });

  if (conflict) return errorState("Esse horário já está ocupado. Escolha outro horário.", { time: ["Esse horário já está ocupado."] });

  const email = stringOrNull(parsed.data.email);

  try {
    await db.$transaction(async (transaction) => {
      const existingClient = await transaction.client.findFirst({
        where: {
          organizationId: organization.id,
          archivedAt: null,
          OR: [{ phone: parsed.data.phone }, ...(email ? [{ email }] : [])],
        },
        orderBy: { createdAt: "asc" },
      });

      const client = existingClient ?? await transaction.client.create({
        data: {
          organizationId: organization.id,
          name: parsed.data.name,
          phone: parsed.data.phone,
          email,
        },
      });

      await transaction.appointment.create({
        data: {
          organizationId: organization.id,
          memberId: member.id,
          clientId: client.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          status: "SCHEDULED",
          notes: stringOrNull(parsed.data.notes),
        },
      });
    });
  } catch (error) {
    if (isConflictError(error)) return errorState("Esse horário acabou de ser ocupado. Escolha outro horário.");
    throw error;
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  revalidatePath(`/agendar/${organization.slug}`);
  return successState("Pedido enviado. A profissional confirmará seu horário em breve.");
}
