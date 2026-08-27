"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import { createServiceAction } from "@/modules/services/actions";

export function ServiceForm() {
  const [state, action, pending] = useActionState(createServiceAction, initialActionState);
  return (
    <form action={action} className="card form-card">
      <div className="card-header"><div><h2 className="card-title">Novo serviço</h2><p className="card-subtitle">Preço e duração ficam registrados no catálogo.</p></div></div>
      <div className="form-grid">
        <label className="field full"><span>Nome do serviço</span><input name="name" placeholder="Ex.: Maquiagem social" required /></label>
        <label className="field"><span>Duração (minutos)</span><input name="durationMinutes" type="number" min="15" step="15" placeholder="90" required /></label>
        <label className="field"><span>Preço (R$)</span><input name="price" inputMode="decimal" placeholder="180,00" required /></label>
        <label className="field full"><span>Descrição</span><textarea name="description" placeholder="O que está incluído neste serviço?" /></label>
      </div>
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{state.message}</p>}
      <div className="form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar serviço"}</button></div>
    </form>
  );
}
