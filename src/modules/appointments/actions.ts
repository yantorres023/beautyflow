"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { localDateTimeToUtc } from "@/lib/dates";
import { stringOrNull } from "@/lib/validation";
import { appointmentSchema } from "@/modules/appointments/schemas";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";
import { sendAppointmentConfirmationEmail } from "@/server/mailer";

function isConflictError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const details = error as { code?: string; message?: string; meta?: unknown };
  const text = JSON.stringify({ message: details.message, meta: details.meta });
  return details.code === "P2002" || (details.code === "P2004" && /appointments_no_overlap|exclusion constraint/i.test(text));
}

export async function createAppointmentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = appointmentSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    status: formData.get("status") || "SCHEDULED",
    notes: formData.get("notes"),
  });

  if (!parsed.success) return errorState("Revise os dados do agendamento.");
  const context = await requireAuthContext();
  const startsAt = localDateTimeToUtc(parsed.data.date, parsed.data.time, context.organization.timezone);
  if (Number.isNaN(startsAt.getTime())) return errorState("Informe uma data e horário válidos.");
  const [client, service, member] = await Promise.all([
    db.client.findFirst({ where: { id: parsed.data.clientId, organizationId: context.organization.id, archivedAt: null } }),
    db.service.findFirst({ where: { id: parsed.data.serviceId, organizationId: context.organization.id, archivedAt: null, isActive: true } }),
    db.organizationMember.findFirst({ where: { organizationId: context.organization.id, userId: context.user.id, active: true } }),
  ]);

  if (!client || !service || !member) return errorState("Cliente, serviço ou profissional não encontrado.");
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  try {
    await db.appointment.create({
      data: {
        organizationId: context.organization.id,
        memberId: member.id,
        clientId: client.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        status: parsed.data.status,
        notes: stringOrNull(parsed.data.notes),
      },
    });
  } catch (error) {
    if (isConflictError(error)) return errorState("Esse horário se sobrepõe a outro agendamento.");
    throw error;
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return successState("Agendamento criado.");
}

const transitionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELED", "NO_SHOW"]),
});

export async function transitionAppointmentAction(formData: FormData) {
  const parsed = transitionSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const context = await requireAuthContext();

  const appointment = await db.appointment.findFirst({
    where: { id: parsed.data.id, organizationId: context.organization.id },
    include: { client: true, service: true, organization: true },
  });
  if (!appointment) return;

  const updated = await db.appointment.updateMany({
    where: { id: appointment.id, organizationId: context.organization.id, status: appointment.status },
    data: { status: parsed.data.status },
  });
  if (updated.count !== 1) return;

  if (parsed.data.status === "CONFIRMED" && appointment.status === "SCHEDULED" && appointment.client.email) {
    try {
      await sendAppointmentConfirmationEmail({
        to: appointment.client.email,
        clientName: appointment.client.name,
        serviceName: appointment.service.name,
        startsAt: appointment.startsAt,
        timezone: appointment.organization.timezone,
      });
    } catch (error) {
      console.error("[BeautyFlow] Não foi possível enviar a confirmação do agendamento.", error);
    }
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  revalidatePath("/pagamentos");
}
