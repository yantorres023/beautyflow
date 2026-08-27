import Link from "next/link";
import { ArrowLeft, CalendarRange, CircleDollarSign, ReceiptText, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { FinanceChart } from "@/components/finance-chart";
import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/money";
import { getCurrentMonthRange, localDateTimeToUtc, toDateInputValue } from "@/lib/dates";
import { getDashboardSummary } from "@/modules/dashboard/queries";
import { requireAuthContext } from "@/server/auth-context";

function addOneDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined, fallback: Date, timeZone: string, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return localDateTimeToUtc(end ? addOneDate(value) : value, "00:00", timeZone);
}

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const context = await requireAuthContext();
  const defaultRange = getCurrentMonthRange(context.organization.timezone);
  const params = await searchParams;
  const from = parseDate(params.from, defaultRange.from, context.organization.timezone);
  const to = parseDate(params.to, defaultRange.to, context.organization.timezone, true);
  const summary = await getDashboardSummary(context.organization.id, from, to);

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clareza financeira</p><h1>Financeiro</h1><p>Entenda o que seu trabalho gerou e o que realmente entrou no caixa.</p></div><Link href="/dashboard" className="button button-ghost"><ArrowLeft size={16} aria-hidden="true" />Visão geral</Link></div>
      <form className="card filter-row" method="get"><label className="field"><span>De</span><input name="from" type="date" defaultValue={params.from ?? toDateInputValue(defaultRange.from, context.organization.timezone)} /></label><label className="field"><span>Até</span><input name="to" type="date" defaultValue={params.to ?? toDateInputValue(new Date(defaultRange.to.getTime() - 1), context.organization.timezone)} /></label><button className="button button-primary" type="submit"><CalendarRange size={16} aria-hidden="true" />Aplicar período</button></form>
      <section className="grid-4"><MetricCard label="Faturamento" value={formatCurrency(summary.revenueCents)} note="Atendimentos concluídos" icon={<TrendingUp size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Recebido" value={formatCurrency(summary.receivedCents)} note="Pagamentos recebidos" icon={<CircleDollarSign size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Despesas" value={formatCurrency(summary.accruedExpensesCents)} note={`${formatCurrency(summary.paidExpensesCents)} já pagas`} icon={<TrendingDown size={18} aria-hidden="true" />} tone="warning" /><MetricCard label="A receber" value={formatCurrency(summary.receivableCents)} note="Saldo dos atendimentos" icon={<WalletCards size={18} aria-hidden="true" />} /></section>
      <div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Movimento financeiro</h2><p className="card-subtitle">Comparação entre faturamento e despesas.</p></div><div className="legend"><span><i />Faturamento</span><span><i />Despesas</span></div></div><FinanceChart bars={summary.bars} /></section><section className="card"><div className="card-header"><div><h2 className="card-title">Dois jeitos de olhar</h2><p className="card-subtitle">Competência e caixa não são a mesma coisa.</p></div><ReceiptText size={18} color="var(--primary)" aria-hidden="true" /></div><div className="finance-detail"><div><span>Lucro por competência</span><strong>{formatCurrency(summary.competenceProfitCents)}</strong><small>Faturamento - despesas registradas</small></div><div><span>Resultado de caixa</span><strong>{formatCurrency(summary.cashResultCents)}</strong><small>Recebido - despesas pagas</small></div><div><span>Despesas pendentes</span><strong>{formatCurrency(summary.pendingExpensesCents)}</strong><small>Contas ainda não pagas</small></div></div></section></div>
      <section className="card dashboard-callout"><div><p className="eyebrow">Próximo passo</p><h2>Registre o movimento do dia.</h2><p>Use pagamentos e despesas para manter o resultado próximo da realidade.</p></div><div className="page-heading-actions"><Link className="button button-secondary" href="/pagamentos">Pagamentos</Link><Link className="button button-primary" href="/despesas">Despesas</Link></div></section>
    </>
  );
}
