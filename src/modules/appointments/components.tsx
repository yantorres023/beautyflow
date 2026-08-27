"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import { createAppointmentAction } from "@/modules/appointments/actions";

type Option = { id: string; label: string; detail?: string };

export function AppointmentForm({ clients, services }: { clients: Option[]; services: Option[] }) {
  const [state, action, pending] = useActionState(createAppointmentAction, initialActionState);
  return (
    <form action={action} className="card form-card">
      <div className="card-header"><div><h2 className="card-title">Novo agendamento</h2><p className="card-subtitle">O preço e a duração serão capturados do serviço escolhido.</p></div></div>
      <div className="form-grid">
        <label className="field"><span>Cliente</span><select name="clientId" required defaultValue=""><option value="" disabled>Selecione...</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.label}</option>)}</select></label>
        <label className="field"><span>Serviço</span><select name="serviceId" required defaultValue=""><option value="" disabled>Selecione...</option>{services.map((service) => <option value={service.id} key={service.id}>{service.label}{service.detail ? ` · ${service.detail}` : ""}</option>)}</select></label>
        <label className="field"><span>Data</span><input name="date" type="date" required /></label>
        <label className="field"><span>Horário</span><input name="time" type="time" step="900" required /></label>
        <label className="field"><span>Status inicial</span><select name="status" defaultValue="SCHEDULED"><option value="SCHEDULED">Agendado</option><option value="CONFIRMED">Confirmado</option></select></label>
        <label className="field full"><span>Observações</span><textarea name="notes" placeholder="Detalhes importantes para o atendimento." /></label>
      </div>
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{state.message}</p>}
      <div className="form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Criar agendamento"}</button></div>
    </form>
  );
}
