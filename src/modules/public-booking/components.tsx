"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { addDays, localDateTimeToUtc, toDateInputValue } from "@/lib/dates";
import { CalendarDays, Check, Clock3, Phone, UserRound } from "lucide-react";
import { initialActionState } from "@/lib/action-result";
import { formatCurrency } from "@/lib/money";
import { createPublicBookingAction } from "@/modules/public-booking/actions";

type PublicService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
};

type BusyInterval = {
  startsAt: string;
  endsAt: string;
};

const BOOKING_DAY_START = 9 * 60;
const BOOKING_DAY_END = 19 * 60;
const BOOKING_SLOT_INTERVAL = 30;
const BOOKING_DAYS_TO_SHOW = 14;
const suggestedTimes = Array.from(
  { length: (BOOKING_DAY_END - BOOKING_DAY_START) / BOOKING_SLOT_INTERVAL },
  (_, index) => {
    const minutes = BOOKING_DAY_START + index * BOOKING_SLOT_INTERVAL;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  },
);

function FieldError({ field, errors }: { field: string; errors?: Record<string, string[]> }) {
  const message = errors?.[field]?.[0];
  return message ? <span className="field-error" id={`${field}-error`}>{message}</span> : null;
}

function describedBy(field: string, errors?: Record<string, string[]>) {
  return errors?.[field]?.length ? `${field}-error` : undefined;
}

function dateMeta(date: string, timeZone: string) {
  const value = localDateTimeToUtc(date, "12:00", timeZone);
  return {
    weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone }).format(value).replace(".", ""),
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone }).format(value),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone }).format(value).replace(".", ""),
  };
}

function availableSlots(date: string, durationMinutes: number, timeZone: string, busyIntervals: BusyInterval[]) {
  const dayEnd = localDateTimeToUtc(date, "19:00", timeZone);
  if (Number.isNaN(dayEnd.getTime())) return [];

  return suggestedTimes.filter((time) => {
    const startsAt = localDateTimeToUtc(date, time, timeZone);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now() || endsAt.getTime() > dayEnd.getTime()) return false;

    return !busyIntervals.some((interval) => {
      const busyStartsAt = new Date(interval.startsAt);
      const busyEndsAt = new Date(interval.endsAt);
      return startsAt < busyEndsAt && endsAt > busyStartsAt;
    });
  });
}

function displayTime(time: string) {
  return time.replace(":", "h");
}

export function PublicBookingForm({ organizationSlug, services, minDate, timeZone, busyIntervals }: { organizationSlug: string; services: PublicService[]; minDate: string; timeZone: string; busyIntervals: BusyInterval[] }) {
  const [state, action, pending] = useActionState(createPublicBookingAction, initialActionState);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(minDate);
  const [selectedTime, setSelectedTime] = useState("");
  const [copied, setCopied] = useState(false);
  const errors = state.fieldErrors;
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const dates = useMemo(() => {
    const firstDate = localDateTimeToUtc(minDate, "12:00", timeZone);
    return Array.from({ length: BOOKING_DAYS_TO_SHOW }, (_, index) => toDateInputValue(addDays(firstDate, index), timeZone));
  }, [minDate, timeZone]);
  const slots = useMemo(
    () => selectedService ? availableSlots(selectedDate, selectedService.durationMinutes, timeZone, busyIntervals) : [],
    [busyIntervals, selectedDate, selectedService, timeZone],
  );

  function changeDate(date: string) {
    setSelectedDate(date);
    if (selectedService && selectedTime && !availableSlots(date, selectedService.durationMinutes, timeZone, busyIntervals).includes(selectedTime)) {
      setSelectedTime("");
    }
  }

  function changeService(serviceId: string) {
    setSelectedServiceId(serviceId);
    const service = services.find((item) => item.id === serviceId);
    if (!service || (selectedTime && !availableSlots(selectedDate, service.durationMinutes, timeZone, busyIntervals).includes(selectedTime))) {
      setSelectedTime("");
    }
  }

  async function copyStatusLink(statusUrl: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${statusUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form action={action} className="card form-card public-booking-form">
      <div className="card-header"><div><p className="eyebrow">Seu horário</p><h2 className="card-title">Solicite um atendimento</h2><p className="card-subtitle">Preencha seus dados e escolha o melhor momento para você.</p></div><CalendarDays size={20} color="var(--primary)" aria-hidden="true" /></div>
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      {state.message && <div className={state.ok ? "feedback feedback-success booking-success" : "feedback feedback-error"} role={state.ok ? "status" : "alert"}><div className="feedback-heading">{state.ok && <Check size={16} aria-hidden="true" />}<span>{state.message}</span></div>{state.ok && state.data?.statusUrl && <><p>Este link é a forma principal de acompanhar o pedido, mesmo sem criar uma conta.</p><div className="booking-status-link"><code>{state.data.statusUrl}</code><button className="button button-small button-secondary" type="button" onClick={() => copyStatusLink(state.data?.statusUrl ?? "")}>{copied ? "Link copiado" : "Copiar link"}</button></div><Link className="button button-small button-secondary" href={state.data.statusUrl}>Acompanhar status do pedido</Link><p>O envio de e-mail é opcional e depende da configuração do provedor.</p></>}</div>}
      <div className="form-grid">
        <label className="field full"><span>Nome</span><div className="public-input-with-icon"><UserRound size={16} aria-hidden="true" /><input name="name" autoComplete="name" required placeholder="Marina Oliveira" aria-invalid={Boolean(errors?.name)} aria-describedby={describedBy("name", errors)} /></div><FieldError field="name" errors={errors} /></label>
        <label className="field"><span>Telefone</span><div className="public-input-with-icon"><Phone size={16} aria-hidden="true" /><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(11) 99999-0000" aria-invalid={Boolean(errors?.phone)} aria-describedby={describedBy("phone", errors)} /></div><FieldError field="phone" errors={errors} /></label>
        <label className="field"><span>E-mail <small>(opcional)</small></span><input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" aria-invalid={Boolean(errors?.email)} aria-describedby={describedBy("email", errors)} /><FieldError field="email" errors={errors} /></label>
        <label className="field full"><span>Serviço</span><select name="serviceId" required value={selectedServiceId} onChange={(event) => changeService(event.target.value)} aria-invalid={Boolean(errors?.serviceId)} aria-describedby={describedBy("serviceId", errors)}><option value="" disabled>Selecione um serviço</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · {formatCurrency(service.priceCents)} · {service.durationMinutes} min</option>)}</select><FieldError field="serviceId" errors={errors} /></label>
        <div className="field full booking-calendar-picker"><div className="booking-picker-heading"><span>Escolha o dia</span><small>Próximos 14 dias</small></div><div className="booking-date-strip" aria-label="Escolha uma data">{dates.map((date) => { const meta = dateMeta(date, timeZone); return <button type="button" className={`booking-date-button${selectedDate === date ? " booking-date-button-selected" : ""}`} key={date} onClick={() => changeDate(date)} aria-pressed={selectedDate === date}><span>{meta.weekday}</span><strong>{meta.day}</strong><small>{meta.month}</small></button>; })}</div><label className="field booking-other-date"><span>Ou escolha outra data</span><input name="date" type="date" min={minDate} required value={selectedDate} onChange={(event) => changeDate(event.target.value)} aria-invalid={Boolean(errors?.date)} aria-describedby={describedBy("date", errors)} /></label><FieldError field="date" errors={errors} /></div>
        <div className="field full booking-time-picker"><div className="booking-picker-heading"><span>Horários sugeridos</span><small>{selectedService ? `${slots.length} opções para ${selectedService.durationMinutes} min` : "Escolha um serviço primeiro"}</small></div>{selectedService ? <div className="booking-time-grid">{slots.map((time) => <button type="button" className={`booking-time-button${selectedTime === time ? " booking-time-button-selected" : ""}`} key={time} onClick={() => setSelectedTime(time)} aria-pressed={selectedTime === time}><Clock3 size={14} aria-hidden="true" />{displayTime(time)}</button>)}{slots.length === 0 && <p className="field-hint">Não encontramos um horário livre neste dia. Tente outra data.</p>}</div> : <p className="field-hint">Os horários aparecem depois que você escolher o serviço.</p>}<label className="field booking-selected-time"><span>Horário selecionado</span><div className="public-input-with-icon"><Clock3 size={16} aria-hidden="true" /><input name="time" type="time" step="900" required value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} aria-invalid={Boolean(errors?.time)} aria-describedby={describedBy("time", errors)} /></div></label><FieldError field="time" errors={errors} /></div>
        <label className="field full"><span>Observações <small>(opcional)</small></span><textarea name="notes" placeholder="Conte algo importante para o atendimento." aria-invalid={Boolean(errors?.notes)} aria-describedby={describedBy("notes", errors)} /><FieldError field="notes" errors={errors} /></label>
      </div>
      <p className="field-hint public-booking-hint">O pedido entra como solicitação e será confirmado pela profissional. Não é necessário criar uma conta. Os horários sugeridos consideram o expediente padrão do espaço.</p>
      <div className="form-actions"><button className="button button-primary button-wide" disabled={pending}>{pending ? "Enviando pedido..." : "Solicitar este horário"}</button></div>
    </form>
  );
}
