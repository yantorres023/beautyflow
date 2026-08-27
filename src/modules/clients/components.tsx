"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import { createClientAction } from "@/modules/clients/actions";

export function ClientForm() {
  const [state, action, pending] = useActionState(createClientAction, initialActionState);
  return (
    <form action={action} className="card form-card">
      <div className="card-header"><div><h2 className="card-title">Nova cliente</h2><p className="card-subtitle">Cadastre os dados essenciais para seus próximos atendimentos.</p></div></div>
      <div className="form-grid">
        <label className="field full"><span>Nome completo</span><input name="name" placeholder="Ex.: Ana Souza" required /></label>
        <label className="field"><span>Telefone</span><input name="phone" type="tel" placeholder="(11) 99999-0000" /></label>
        <label className="field"><span>E-mail</span><input name="email" type="email" placeholder="ana@exemplo.com" /></label>
        <label className="field full"><span>Observações</span><textarea name="notes" placeholder="Preferências, alergias ou detalhes importantes." /></label>
      </div>
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{state.message}</p>}
      <div className="form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar cliente"}</button></div>
    </form>
  );
}
