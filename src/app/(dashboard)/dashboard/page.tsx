import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleDollarSign, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { FinanceChart } from "@/components/finance-chart";
import { MetricCard } from "@/components/metric-card";
import { formatDate, formatTime, getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { getDashboardSummary } from "@/modules/dashboard/queries";
import { requireAuthContext } from "@/server/auth-context";

export default async function DashboardPage() {
  const context = await requireAuthContext();
  const range = getCurrentMonthRange(context.organization.timezone);
  const summary = await getDashboardSummary(context.organization.id, range.from, range.to);

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Visão geral</p><h1>Bom dia, {context.user.name.split(" ")[0]}.</h1><p>Um retrato tranquilo do que está acontecendo no seu espaço neste mês.</p></div><Link href="/financeiro" className="button button-ghost">Ver financeiro <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <section className="grid-4"><MetricCard label="Faturamento" value={formatCurrency(summary.revenueCents)} note={`${summary.completedCount} atendimentos concluídos`} icon={<TrendingUp size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Recebido" value={formatCurrency(summary.receivedCents)} note="Entradas no período" icon={<CircleDollarSign size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="A receber" value={formatCurrency(summary.receivableCents)} note="Saldos em aberto" icon={<WalletCards size={18} aria-hidden="true" />} tone="warning" /><MetricCard label="Ticket médio" value={formatCurrency(summary.averageTicketCents)} note="Por atendimento concluído" icon={<ReceiptText size={18} aria-hidden="true" />} /></section>
      <div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Entradas e despesas</h2><p className="card-subtitle">Competência do mês atual</p></div><div className="legend"><span><i />Faturamento</span><span><i />Despesas</span></div></div><FinanceChart bars={summary.bars} /></section><section className="card"><div className="card-header"><div><h2 className="card-title">Próximos atendimentos</h2><p className="card-subtitle">Os próximos 14 dias</p></div><CalendarDays size={18} color="var(--primary)" aria-hidden="true" /></div>{summary.upcoming.length === 0 ? <div className="empty-state"><CalendarDays size={28} aria-hidden="true" /><strong>Agenda livre por enquanto</strong><p>Que tal registrar o próximo atendimento?</p><Link href="/agenda" className="button button-secondary button-small">Abrir agenda</Link></div> : <div className="list">{summary.upcoming.map((appointment) => <div className="list-row" key={appointment.id}><div className="list-main"><span className="list-avatar">{appointment.clientName.slice(0, 1).toUpperCase()}</span><span className="list-copy"><strong>{formatTime(appointment.startsAt, context.organization.timezone)} · {appointment.clientName}</strong><span>{appointment.serviceName} · {formatDate(appointment.startsAt, context.organization.timezone)}</span></span></div><span className="list-value">{formatCurrency(appointment.priceCents)}</span></div>)}</div>}</section></div>
      <section className="card dashboard-callout"><div><p className="eyebrow">Resultado do mês</p><h2>{formatCurrency(summary.competenceProfitCents)}</h2><p>Lucro por competência: faturamento menos despesas registradas. Resultado de caixa: <strong>{formatCurrency(summary.cashResultCents)}</strong>.</p></div><Link className="button button-primary" href="/financeiro">Analisar números <ArrowUpRight size={16} aria-hidden="true" /></Link></section>
    </>
  );
}
