import { CircleDollarSign, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { voidPaymentAction } from "@/modules/payments/actions";
import { PaymentForm } from "@/modules/payments/components";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

const methodLabels = { PIX: "Pix", CASH: "Dinheiro", CARD: "Cartão", TRANSFER: "Transferência", OTHER: "Outro" } as const;

export default async function PaymentsPage() {
  const context = await requireAuthContext();
  const appointments = await db.appointment.findMany({
    where: { organizationId: context.organization.id, status: { notIn: ["CANCELED", "NO_SHOW"] } },
    include: { client: true, service: true, payments: { where: { status: "RECEIVED" }, orderBy: { receivedAt: "desc" } } },
    orderBy: { startsAt: "desc" },
  });
  const activeAppointments = appointments.filter((appointment) => appointment.priceCents > appointment.payments.reduce((sum, payment) => sum + payment.amountCents, 0));
  const recentPayments = appointments.flatMap((appointment) => appointment.payments.map((payment) => ({ ...payment, clientName: appointment.client.name, serviceName: appointment.service.name }))).sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()).slice(0, 12);

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Entradas</p><h1>Pagamentos</h1><p>Registre sinais e saldos sem perder o fio do que ainda falta receber.</p></div><span className="status-badge status-confirmed">{recentPayments.length} recentes</span></div>
      <div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Recebimentos recentes</h2><p className="card-subtitle">Pagamentos registrados no seu espaço.</p></div></div>{recentPayments.length === 0 ? <div className="empty-state"><CircleDollarSign size={30} aria-hidden="true" /><strong>Nenhum pagamento registrado</strong><p>Quando você registrar um sinal ou saldo, ele aparecerá aqui.</p></div> : <div className="list">{recentPayments.map((payment) => <div className="list-row" key={payment.id}><div className="list-main"><span className="list-avatar"><CircleDollarSign size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{payment.clientName}</strong><span>{payment.serviceName} · {methodLabels[payment.method]} · {formatDate(payment.receivedAt, context.organization.timezone)}</span></span></div><div className="list-value"><strong>{formatCurrency(payment.amountCents)}</strong><form action={voidPaymentAction} style={{ marginTop: 6 }}><input type="hidden" name="id" value={payment.id} /><button className="button button-small button-ghost" type="submit"><RotateCcw size={13} aria-hidden="true" />Anular</button></form></div></div>)}</div>}</section><PaymentForm appointments={activeAppointments.map((appointment) => ({ id: appointment.id, label: `${appointment.client.name} · ${appointment.service.name}`, balance: formatCurrency(appointment.priceCents - appointment.payments.reduce((sum, payment) => sum + payment.amountCents, 0)) }))} /></div>
      <section className="card" style={{ marginTop: 18 }}><div className="card-header"><div><h2 className="card-title">Saldos dos atendimentos</h2><p className="card-subtitle">Acompanhe o que já entrou e o que continua em aberto.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Cliente</th><th>Serviço</th><th>Status</th><th>Recebido</th><th className="align-right">A receber</th></tr></thead><tbody>{appointments.slice(0, 20).map((appointment) => { const received = appointment.payments.reduce((sum, payment) => sum + payment.amountCents, 0); return <tr key={appointment.id}><td>{appointment.client.name}</td><td>{appointment.service.name}</td><td><span className={`status-badge status-${appointment.status.toLowerCase().replace("_", "-")}`}>{appointment.status === "COMPLETED" ? "Concluído" : appointment.status === "CONFIRMED" ? "Confirmado" : appointment.status === "SCHEDULED" ? "Agendado" : appointment.status === "CANCELED" ? "Cancelado" : "No-show"}</span></td><td>{formatCurrency(received)}</td><td className="align-right">{formatCurrency(Math.max(appointment.priceCents - received, 0))}</td></tr>; })}</tbody></table></div></section>
    </>
  );
}
