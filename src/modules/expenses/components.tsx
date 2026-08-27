"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import { createExpenseAction } from "@/modules/expenses/actions";

export function ExpenseForm() {
  const [state, action, pending] = useActionState(createExpenseAction, initialActionState);
  return (
    <form action={action} className="card form-card">
      <div className="card-header"><div><h2 className="card-title">Nova despesa</h2><p className="card-subtitle">Despesas começam pendentes e só entram no caixa quando pagas.</p></div></div>
      <div className="form-grid">
        <label className="field full"><span>Descrição</span><input name="description" placeholder="Ex.: Reposição de materiais" required /></label>
        <label className="field"><span>Categoria</span><input name="category" placeholder="Materiais" required /></label>
        <label className="field"><span>Valor (R$)</span><input name="amount" inputMode="decimal" placeholder="85,00" required /></label>
        <label className="field"><span>Data da despesa</span><input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="field"><span>Vencimento (opcional)</span><input name="dueDate" type="date" /></label>
      </div>
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{state.message}</p>}
      <div className="form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar despesa"}</button></div>
    </form>
  );
}
