import { Check, CircleAlert, ReceiptText, X } from "lucide-react";
import { formatDate, formatDateOnly } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { cancelExpenseAction, markExpensePaidAction } from "@/modules/expenses/actions";
import { ExpenseForm } from "@/modules/expenses/components";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

export default async function ExpensesPage() {
  const context = await requireAuthContext();
  const expenses = await db.expense.findMany({ where: { organizationId: context.organization.id, status: { not: "CANCELED" } }, orderBy: [{ status: "asc" }, { expenseDate: "desc" }] });
  const pending = expenses.filter((expense) => expense.status === "PENDING");
  const paid = expenses.filter((expense) => expense.status === "PAID");

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Saídas</p><h1>Despesas</h1><p>Registre os custos do seu trabalho e veja o impacto real no caixa.</p></div><span className="status-badge status-pending">{pending.length} pendentes</span></div>
      <div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Contas do espaço</h2><p className="card-subtitle">{paid.length} pagas · {pending.length} aguardando pagamento.</p></div></div>{expenses.length === 0 ? <div className="empty-state"><ReceiptText size={30} aria-hidden="true" /><strong>Nenhuma despesa registrada</strong><p>Adicione materiais, ferramentas ou outros custos para acompanhar seu resultado.</p></div> : <div className="list">{expenses.map((expense) => <div className="list-row" key={expense.id}><div className="list-main"><span className="list-avatar">{expense.status === "PENDING" ? <CircleAlert size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</span><span className="list-copy"><strong>{expense.description}</strong><span>{expense.category} · {formatDateOnly(expense.expenseDate)}{expense.paidAt ? ` · paga em ${formatDate(expense.paidAt, context.organization.timezone)}` : ""}</span></span></div><div className="list-value"><strong>{formatCurrency(expense.amountCents)}</strong>{expense.status === "PENDING" ? <div className="row-actions"><form action={markExpensePaidAction} className="inline-form"><input type="hidden" name="id" value={expense.id} /><select name="method" defaultValue="PIX" aria-label={`Método de pagamento para ${expense.description}`} className="mini-select"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="TRANSFER">TED</option><option value="OTHER">Outro</option></select><button className="button button-small button-secondary" type="submit">Pagar</button></form><form action={cancelExpenseAction} className="inline-form"><input type="hidden" name="id" value={expense.id} /><button className="icon-button" type="submit" aria-label={`Cancelar ${expense.description}`} title="Cancelar"><X size={15} aria-hidden="true" /></button></form></div> : <span className="status-badge status-paid">Paga</span>}</div></div>)}</div>}</section><ExpenseForm /></div>
    </>
  );
}
