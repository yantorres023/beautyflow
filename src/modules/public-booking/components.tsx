"use client";

import { useActionState } from "react";
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

function FieldError({ field, errors }: { field: string; errors?: Record<string, string[]> }) {
  const message = errors?.[field]?.[0];
  return message ? <span className="field-error" id={`${field}-error`}>{message}</span> : null;
}

function describedBy(field: string, errors?: Record<string, string[]>) {
  return errors?.[field]?.length ? `${field}-error` : undefined;
}

export function PublicBookingForm({ organizationSlug, services, minDate }: { organizationSlug: string; services: PublicService[]; minDate: string }) {
  const [state, action, pending] = useActionState(createPublicBookingAction, initialActionState);
  const errors = state.fieldErrors;

  return (
    <form action={action} className="card form-card public-booking-form">
      <div className="card-header"><div><p className="eyebrow">Seu horário</p><h2 className="card-title">Solicite um atendimento</h2><p className="card-subtitle">Preencha seus dados e escolha o melhor momento para você.</p></div><CalendarDays size={20} color="var(--primary)" aria-hidden="true" /></div>
      <input type="hidden" name="organizationSlug" value={organizationSlug} />
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role={state.ok ? "status" : "alert"}>{state.ok && <Check size={16} aria-hidden="true" />} {state.message}</p>}
      <div className="form-grid">
        <label className="field full"><span>Nome</span><div className="public-input-with-icon"><UserRound size={16} aria-hidden="true" /><input name="name" autoComplete="name" required placeholder="Marina Oliveira" aria-invalid={Boolean(errors?.name)} aria-describedby={describedBy("name", errors)} /></div><FieldError field="name" errors={errors} /></label>
        <label className="field"><span>Telefone</span><div className="public-input-with-icon"><Phone size={16} aria-hidden="true" /><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(11) 99999-0000" aria-invalid={Boolean(errors?.phone)} aria-describedby={describedBy("phone", errors)} /></div><FieldError field="phone" errors={errors} /></label>
        <label className="field"><span>E-mail <small>(opcional)</small></span><input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" aria-invalid={Boolean(errors?.email)} aria-describedby={describedBy("email", errors)} /><FieldError field="email" errors={errors} /></label>
        <label className="field full"><span>Serviço</span><select name="serviceId" required defaultValue="" aria-invalid={Boolean(errors?.serviceId)} aria-describedby={describedBy("serviceId", errors)}><option value="" disabled>Selecione um serviço</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · {formatCurrency(service.priceCents)} · {service.durationMinutes} min</option>)}</select><FieldError field="serviceId" errors={errors} /></label>
        <label className="field"><span>Data</span><input name="date" type="date" min={minDate} required aria-invalid={Boolean(errors?.date)} aria-describedby={describedBy("date", errors)} /><FieldError field="date" errors={errors} /></label>
        <label className="field"><span>Horário</span><div className="public-input-with-icon"><Clock3 size={16} aria-hidden="true" /><input name="time" type="time" step="900" required aria-invalid={Boolean(errors?.time)} aria-describedby={describedBy("time", errors)} /></div><FieldError field="time" errors={errors} /></label>
        <label className="field full"><span>Observações <small>(opcional)</small></span><textarea name="notes" placeholder="Conte algo importante para o atendimento." aria-invalid={Boolean(errors?.notes)} aria-describedby={describedBy("notes", errors)} /><FieldError field="notes" errors={errors} /></label>
      </div>
      <p className="field-hint public-booking-hint">O pedido entra como solicitação e será confirmado pela profissional. Não é necessário criar uma conta.</p>
      <div className="form-actions"><button className="button button-primary button-wide" disabled={pending}>{pending ? "Enviando pedido..." : "Solicitar este horário"}</button></div>
    </form>
  );
}
