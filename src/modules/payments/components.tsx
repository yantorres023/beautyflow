"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import { recordPaymentAction } from "@/modules/payments/actions";

type AppointmentOption = { id: string; label: string; balance: string };

export function PaymentForm({ appointments }: { appointments: AppointmentOption[] }) {
  const [state, action, pending] = useActionState(recordPaymentAction, initialActionState);
  return (
    <form action={action} className="card form-card">
      <div className="card-header"><div><h2 className="card-title">Registrar recebimento</h2><p className="card-subtitle">Use para sinal, saldo ou um pagamento parcial.</p></div></div>
      <div className="form-grid">
        <label className="field full"><span>Atendimento</span><select name="appointmentId" required defaultValue=""><option value="" disabled>Selecione...</option>{appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.label} · saldo {appointment.balance}</option>)}</select></label>
        <label className="field"><span>Valor (R$)</span><input name="amount" inputMode="decimal" placeholder="90,00" required /></label>
        <label className="field"><span>Data do recebimento</span><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="field"><span>Tipo</span><select name="type" defaultValue="DEPOSIT"><option value="DEPOSIT">Sinal</option><option value="BALANCE">Saldo</option><option value="OTHER">Outro</option></select></label>
        <label className="field"><span>Método</span><select name="method" defaultValue="PIX"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="TRANSFER">Transferência</option><option value="OTHER">Outro</option></select></label>
      </div>
      {state.message && <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{state.message}</p>}
      <div className="form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Registrando..." : "Registrar pagamento"}</button></div>
    </form>
  );
}
