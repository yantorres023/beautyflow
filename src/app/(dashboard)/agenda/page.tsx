import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock3, UserRound, X } from "lucide-react";
import { addDays, formatDate, formatTime, localDateTimeToUtc, startOfLocalWeekInTimezone, toDateInputValue } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { transitionAppointmentAction } from "@/modules/appointments/actions";
import { AppointmentForm } from "@/modules/appointments/components";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const statusLabels = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "No-show",
} as const;

function getWeekStart(value: string | undefined, timeZone: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return startOfLocalWeekInTimezone(new Date(), timeZone);
  const requestedDate = localDateTimeToUtc(value, "12:00", timeZone);
  return Number.isNaN(requestedDate.getTime())
    ? startOfLocalWeekInTimezone(new Date(), timeZone)
    : startOfLocalWeekInTimezone(requestedDate, timeZone);
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ semana?: string | string[] }> }) {
  const context = await requireAuthContext();
  const params = await searchParams;
  const requestedWeek = typeof params.semana === "string" ? params.semana : undefined;
  const weekStart = getWeekStart(requestedWeek, context.organization.timezone);
  const currentWeekStart = startOfLocalWeekInTimezone(new Date(), context.organization.timezone);
  const weekEnd = addDays(weekStart, 7);
  const [appointments, clients, services] = await Promise.all([
    db.appointment.findMany({
      where: { organizationId: context.organization.id, startsAt: { gte: weekStart, lt: weekEnd } },
      include: { client: true, service: true },
      orderBy: { startsAt: "asc" },
    }),
    db.client.findMany({ where: { organizationId: context.organization.id, archivedAt: null }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { organizationId: context.organization.id, archivedAt: null, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const appointmentsByDay = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    const key = toDateInputValue(appointment.startsAt, context.organization.timezone);
    appointmentsByDay.set(key, [...(appointmentsByDay.get(key) ?? []), appointment]);
  }

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Seu ritmo</p><h1>Agenda</h1><p>Uma semana clara para você chegar preparada a cada atendimento.</p></div><span className="status-badge status-confirmed">{appointments.length} no período</span></div>
      <div className="page-heading-actions calendar-page-actions"><div className="calendar-navigation" aria-label="Navegação da agenda"><Link className="icon-button" href={`/agenda?semana=${toDateInputValue(addDays(weekStart, -7), context.organization.timezone)}`} aria-label="Semana anterior" title="Semana anterior"><ChevronLeft size={17} aria-hidden="true" /></Link><Link className="button button-small button-ghost" href={toDateInputValue(weekStart, context.organization.timezone) === toDateInputValue(currentWeekStart, context.organization.timezone) ? "/agenda" : `/agenda?semana=${toDateInputValue(currentWeekStart, context.organization.timezone)}`}>Esta semana</Link><Link className="icon-button" href={`/agenda?semana=${toDateInputValue(addDays(weekStart, 7), context.organization.timezone)}`} aria-label="Próxima semana" title="Próxima semana"><ChevronRight size={17} aria-hidden="true" /></Link></div><form className="calendar-jump-form" method="get"><label className="field"><span className="sr-only">Ir para a semana da data</span><input type="date" name="semana" defaultValue={toDateInputValue(weekStart, context.organization.timezone)} /></label><button className="button button-small button-secondary" type="submit">Ir</button></form></div>
      <section className="card calendar-card">
        <div className="calendar-toolbar"><div><strong>{formatDate(weekStart, context.organization.timezone)} — {formatDate(addDays(weekStart, 6), context.organization.timezone)}</strong><p className="card-subtitle">Horários no fuso do seu espaço</p></div><div className="legend"><span><i />Confirmado</span><span><i />Agendado</span></div></div>
        <div className="calendar-week">
          {days.map((day) => {
            const key = toDateInputValue(day, context.organization.timezone);
            const dayAppointments = appointmentsByDay.get(key) ?? [];
            const todayKey = toDateInputValue(new Date(), context.organization.timezone);
            return <div className={`calendar-day${key === todayKey ? " calendar-day-today" : ""}`} key={key}>
              <div className="calendar-day-label"><span>{new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: context.organization.timezone }).format(day).replace(".", "")}</span><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: context.organization.timezone }).format(day)}</strong></div>
              {dayAppointments.map((appointment) => <div className="appointment-chip" key={appointment.id}><span>{formatTime(appointment.startsAt, context.organization.timezone)} · {formatTime(appointment.endsAt, context.organization.timezone)}</span><strong>{appointment.client.name}</strong><span>{appointment.service.name}</span></div>)}
              {dayAppointments.length === 0 && <span className="calendar-empty">Livre</span>}
            </div>;
          })}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="card"><div className="card-header"><div><h2 className="card-title">Próximos atendimentos</h2><p className="card-subtitle">Atualize o status conforme seu dia avança.</p></div></div>
          {appointments.length === 0 ? <div className="empty-state"><CalendarDays size={30} aria-hidden="true" /><strong>Sua agenda está livre</strong><p>Adicione um atendimento para começar a organizar sua semana.</p></div> : <div className="list">{appointments.map((appointment) => <div className="list-row" key={appointment.id}><div className="list-main"><span className="list-avatar"><UserRound size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{formatTime(appointment.startsAt, context.organization.timezone)} · {appointment.client.name}</strong><span>{appointment.service.name} · {formatCurrency(appointment.priceCents)} · {formatDate(appointment.startsAt, context.organization.timezone)}</span></span></div><div className="list-value"><span className={`status-badge status-${appointment.status.toLowerCase().replace("_", "-")}`}>{statusLabels[appointment.status]}</span><div className="row-actions">{appointment.status === "SCHEDULED" && <TransitionButton id={appointment.id} status="CONFIRMED" label="Confirmar" icon={<Check size={13} aria-hidden="true" />} />}{appointment.status === "CONFIRMED" && <TransitionButton id={appointment.id} status="COMPLETED" label="Concluir" icon={<CircleCheck size={13} aria-hidden="true" />} />} {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && <><TransitionButton id={appointment.id} status="CANCELED" label="Cancelar" icon={<CircleX size={13} aria-hidden="true" />} danger /><TransitionButton id={appointment.id} status="NO_SHOW" label="No-show" icon={<X size={13} aria-hidden="true" />} danger /></>}</div></div></div>)}</div>}
        </section>
        <AppointmentForm clients={clients.map((client) => ({ id: client.id, label: client.name }))} services={services.map((service) => ({ id: service.id, label: service.name, detail: `${service.durationMinutes} min` }))} />
      </div>
    </>
  );
}

function TransitionButton({ id, status, label, icon, danger = false }: { id: string; status: "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW"; label: string; icon: React.ReactNode; danger?: boolean }) {
  return <form action={transitionAppointmentAction} className="inline-form"><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button className={`button button-small ${danger ? "button-danger" : "button-ghost"}`} type="submit" title={label}>{icon}<span className="desktop-action-label">{label}</span></button></form>;
}
