"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  ContactRound,
  LayoutDashboard,
  Plus,
  ReceiptText,
  RotateCcw,
  Scissors,
  Sparkles,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { FinanceChart } from "@/components/finance-chart";
import { MetricCard } from "@/components/metric-card";
import { APP_TIMEZONE, formatDateOnly, formatDateTime, formatTime, localDateTimeToUtc } from "@/lib/dates";
import { formatCurrency, parseMoneyToCents } from "@/lib/money";

type DemoView = "dashboard" | "agenda" | "clients" | "services" | "payments" | "expenses" | "finance";
type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
type PaymentType = "DEPOSIT" | "BALANCE" | "OTHER";
type PaymentMethod = "PIX" | "CASH" | "CARD" | "TRANSFER" | "OTHER";
type PaymentStatus = "RECEIVED" | "VOIDED";
type ExpenseStatus = "PENDING" | "PAID" | "CANCELED";

type DemoClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  archived: boolean;
};

type DemoService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  archived: boolean;
};

type DemoAppointment = {
  id: string;
  clientId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
  status: AppointmentStatus;
  notes: string;
};

type DemoPayment = {
  id: string;
  appointmentId: string;
  type: PaymentType;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receivedAt: string;
};

type DemoExpense = {
  id: string;
  description: string;
  category: string;
  amountCents: number;
  expenseDate: string;
  status: ExpenseStatus;
  paidAt: string | null;
  method: PaymentMethod | null;
};

type DemoState = {
  clients: DemoClient[];
  services: DemoService[];
  appointments: DemoAppointment[];
  payments: DemoPayment[];
  expenses: DemoExpense[];
};

type Notice = { message: string; ok: boolean } | null;

const DEMO_STORAGE_KEY = "beautyflow-demo-state-v1";

const navItems: Array<{ view: DemoView; label: string; icon: LucideIcon }> = [
  { view: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { view: "agenda", label: "Agenda", icon: CalendarDays },
  { view: "clients", label: "Clientes", icon: ContactRound },
  { view: "services", label: "Serviços", icon: Scissors },
  { view: "payments", label: "Pagamentos", icon: CircleDollarSign },
  { view: "expenses", label: "Despesas", icon: WalletCards },
  { view: "finance", label: "Financeiro", icon: ChartNoAxesCombined },
];

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "No-show",
};

const methodLabels: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "TED",
  OTHER: "Outro",
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInitialState(): DemoState {
  return {
    clients: [
      { id: "client-ana", name: "Ana Souza", phone: "(11) 99999-0000", email: "ana@example.com", notes: "Prefere atendimento pela manhã.", archived: false },
      { id: "client-beatriz", name: "Beatriz Lima", phone: "(11) 98888-1111", email: "beatriz@example.com", notes: "Cliente recorrente.", archived: false },
      { id: "client-carol", name: "Carolina Mendes", phone: "(11) 97777-2222", email: "carol@example.com", notes: "Evento no fim de semana.", archived: false },
    ],
    services: [
      { id: "service-social", name: "Maquiagem social", description: "Produção completa para eventos.", durationMinutes: 90, priceCents: 18000, archived: false },
      { id: "service-noiva", name: "Maquiagem para noivas", description: "Produção personalizada e prova.", durationMinutes: 180, priceCents: 32000, archived: false },
      { id: "service-express", name: "Make express", description: "Uma produção prática para o dia a dia.", durationMinutes: 45, priceCents: 11000, archived: false },
    ],
    appointments: [
      { id: "appointment-ana-1", clientId: "client-ana", serviceId: "service-social", startsAt: "2026-09-02T10:00:00-03:00", endsAt: "2026-09-02T11:30:00-03:00", durationMinutes: 90, priceCents: 18000, status: "COMPLETED", notes: "", },
      { id: "appointment-beatriz-1", clientId: "client-beatriz", serviceId: "service-noiva", startsAt: "2026-09-04T15:00:00-03:00", endsAt: "2026-09-04T18:00:00-03:00", durationMinutes: 180, priceCents: 32000, status: "CONFIRMED", notes: "Levar referência da paleta.", },
      { id: "appointment-carol-1", clientId: "client-carol", serviceId: "service-express", startsAt: "2026-09-07T09:00:00-03:00", endsAt: "2026-09-07T09:45:00-03:00", durationMinutes: 45, priceCents: 11000, status: "SCHEDULED", notes: "", },
      { id: "appointment-ana-2", clientId: "client-ana", serviceId: "service-social", startsAt: "2026-09-09T14:00:00-03:00", endsAt: "2026-09-09T15:30:00-03:00", durationMinutes: 90, priceCents: 18000, status: "COMPLETED", notes: "", },
    ],
    payments: [
      { id: "payment-ana-deposit", appointmentId: "appointment-ana-1", type: "DEPOSIT", amountCents: 5000, method: "PIX", status: "RECEIVED", receivedAt: "2026-08-29T12:00:00-03:00" },
      { id: "payment-ana-balance", appointmentId: "appointment-ana-1", type: "BALANCE", amountCents: 13000, method: "CARD", status: "RECEIVED", receivedAt: "2026-09-02T12:00:00-03:00" },
      { id: "payment-beatriz-deposit", appointmentId: "appointment-beatriz-1", type: "DEPOSIT", amountCents: 10000, method: "PIX", status: "RECEIVED", receivedAt: "2026-08-30T12:00:00-03:00" },
      { id: "payment-ana-2", appointmentId: "appointment-ana-2", type: "OTHER", amountCents: 18000, method: "PIX", status: "RECEIVED", receivedAt: "2026-09-09T12:00:00-03:00" },
    ],
    expenses: [
      { id: "expense-materials", description: "Reposição de pincéis", category: "Materiais", amountCents: 8500, expenseDate: "2026-09-01", status: "PAID", paidAt: "2026-09-01T16:00:00-03:00", method: "CARD" },
      { id: "expense-rent", description: "Aluguel da sala", category: "Espaço", amountCents: 45000, expenseDate: "2026-09-03", status: "PENDING", paidAt: null, method: null },
      { id: "expense-products", description: "Produtos para pele", category: "Materiais", amountCents: 12500, expenseDate: "2026-09-06", status: "PAID", paidAt: "2026-09-06T13:00:00-03:00", method: "PIX" },
    ],
  };
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoState>;
  return [state.clients, state.services, state.appointments, state.payments, state.expenses].every(Array.isArray);
}

function getReceivedCents(appointmentId: string, payments: DemoPayment[]) {
  return payments.filter((payment) => payment.appointmentId === appointmentId && payment.status === "RECEIVED").reduce((sum, payment) => sum + payment.amountCents, 0);
}

function calculateSummary(state: DemoState) {
  const completed = state.appointments.filter((appointment) => appointment.status === "COMPLETED");
  const revenueCents = completed.reduce((sum, appointment) => sum + appointment.priceCents, 0);
  const receivedCents = state.payments.filter((payment) => payment.status === "RECEIVED").reduce((sum, payment) => sum + payment.amountCents, 0);
  const receivableCents = state.appointments
    .filter((appointment) => ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(appointment.status))
    .reduce((sum, appointment) => sum + Math.max(appointment.priceCents - getReceivedCents(appointment.id, state.payments), 0), 0);
  const accruedExpensesCents = state.expenses.filter((expense) => expense.status !== "CANCELED").reduce((sum, expense) => sum + expense.amountCents, 0);
  const paidExpensesCents = state.expenses.filter((expense) => expense.status === "PAID").reduce((sum, expense) => sum + expense.amountCents, 0);
  const weekStart = new Date("2026-09-01T00:00:00-03:00").getTime();
  const bucketFor = (value: string) => Math.min(Math.max(Math.floor((new Date(value).getTime() - weekStart) / (7 * 24 * 60 * 60 * 1000)), 0), 3);
  const bars = Array.from({ length: 4 }, (_, index) => ({
    label: `Sem ${index + 1}`,
    revenueCents: completed.filter((appointment) => bucketFor(appointment.startsAt) === index).reduce((sum, appointment) => sum + appointment.priceCents, 0),
    expenseCents: state.expenses.filter((expense) => expense.status !== "CANCELED" && bucketFor(`${expense.expenseDate}T12:00:00Z`) === index).reduce((sum, expense) => sum + expense.amountCents, 0),
  }));

  return {
    revenueCents,
    receivedCents,
    receivableCents,
    accruedExpensesCents,
    paidExpensesCents,
    pendingExpensesCents: state.expenses.filter((expense) => expense.status === "PENDING").reduce((sum, expense) => sum + expense.amountCents, 0),
    competenceProfitCents: revenueCents - accruedExpensesCents,
    cashResultCents: receivedCents - paidExpensesCents,
    averageTicketCents: completed.length ? Math.round(revenueCents / completed.length) : 0,
    completedCount: completed.length,
    bars,
  };
}

export function DemoApp() {
  const [view, setView] = useState<DemoView>("dashboard");
  const [state, setState] = useState<DemoState>(() => createInitialState());
  const [notice, setNotice] = useState<Notice>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isDemoState(parsed)) setState(parsed);
        }
      } catch {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const notify = (message: string, ok = true) => setNotice({ message, ok });

  const resetDemo = () => {
    if (!window.confirm("Resetar a demonstração e apagar as alterações deste navegador?")) return;
    setState(createInitialState());
    notify("Demonstração restaurada com os dados iniciais.");
  };

  const addClient = (input: Omit<DemoClient, "id" | "archived">) => {
    if (!input.name.trim()) return notify("Informe o nome da cliente.", false);
    setState((current) => ({ ...current, clients: [...current.clients, { ...input, id: createId("client"), archived: false }] }));
    notify("Cliente adicionada à demonstração.");
  };

  const archiveClient = (id: string) => {
    if (!window.confirm("Arquivar esta cliente na demonstração?")) return;
    setState((current) => ({ ...current, clients: current.clients.map((client) => client.id === id ? { ...client, archived: true } : client) }));
    notify("Cliente arquivada.");
  };

  const addService = (input: { name: string; description: string; durationMinutes: number; price: string }) => {
    const priceCents = parseMoneyToCents(input.price);
    if (!input.name.trim() || !priceCents || priceCents <= 0) return notify("Informe nome e preço válidos para o serviço.", false);
    setState((current) => ({ ...current, services: [...current.services, { id: createId("service"), name: input.name.trim(), description: input.description.trim(), durationMinutes: input.durationMinutes, priceCents, archived: false }] }));
    notify("Serviço criado na demonstração.");
  };

  const archiveService = (id: string) => {
    if (!window.confirm("Arquivar este serviço na demonstração?")) return;
    setState((current) => ({ ...current, services: current.services.map((service) => service.id === id ? { ...service, archived: true } : service) }));
    notify("Serviço arquivado.");
  };

  const addAppointment = (input: { clientId: string; serviceId: string; date: string; time: string; status: "SCHEDULED" | "CONFIRMED"; notes: string }) => {
    const client = state.clients.find((item) => item.id === input.clientId && !item.archived);
    const service = state.services.find((item) => item.id === input.serviceId && !item.archived);
    const startsAt = localDateTimeToUtc(input.date, input.time, APP_TIMEZONE);
    if (!client || !service || Number.isNaN(startsAt.getTime())) return notify("Selecione cliente, serviço, data e horário válidos.", false);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const conflict = state.appointments.some((appointment) => appointment.status !== "CANCELED" && startsAt < new Date(appointment.endsAt) && new Date(appointment.startsAt) < endsAt);
    if (conflict) return notify("Esse horário se sobrepõe a outro atendimento. Experimente outro horário.", false);
    setState((current) => ({ ...current, appointments: [...current.appointments, { id: createId("appointment"), clientId: client.id, serviceId: service.id, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), durationMinutes: service.durationMinutes, priceCents: service.priceCents, status: input.status, notes: input.notes.trim() }] }));
    notify("Agendamento criado. O preço e a duração vieram do serviço.");
  };

  const transitionAppointment = (id: string, status: AppointmentStatus) => {
    setState((current) => ({ ...current, appointments: current.appointments.map((appointment) => appointment.id === id ? { ...appointment, status } : appointment) }));
    notify(`Agendamento atualizado para ${appointmentStatusLabels[status].toLowerCase()}.`);
  };

  const addPayment = (input: { appointmentId: string; amount: string; type: PaymentType; method: PaymentMethod; date: string }) => {
    const appointment = state.appointments.find((item) => item.id === input.appointmentId && !["CANCELED", "NO_SHOW"].includes(item.status));
    const amountCents = parseMoneyToCents(input.amount);
    const receivedCents = appointment ? getReceivedCents(appointment.id, state.payments) : 0;
    if (!appointment || !amountCents || amountCents <= 0) return notify("Selecione um atendimento e informe um valor válido.", false);
    if (amountCents > appointment.priceCents - receivedCents) return notify("O recebimento não pode ser maior que o saldo do atendimento.", false);
    const receivedAt = localDateTimeToUtc(input.date, "12:00", APP_TIMEZONE);
    if (Number.isNaN(receivedAt.getTime())) return notify("Informe uma data válida.", false);
    setState((current) => ({ ...current, payments: [...current.payments, { id: createId("payment"), appointmentId: appointment.id, amountCents, type: input.type, method: input.method, status: "RECEIVED", receivedAt: receivedAt.toISOString() }] }));
    notify("Pagamento registrado. O saldo a receber foi atualizado.");
  };

  const voidPayment = (id: string) => {
    if (!window.confirm("Anular este pagamento na demonstração?")) return;
    setState((current) => ({ ...current, payments: current.payments.map((payment) => payment.id === id ? { ...payment, status: "VOIDED" } : payment) }));
    notify("Pagamento anulado.");
  };

  const addExpense = (input: { description: string; category: string; amount: string; expenseDate: string }) => {
    const amountCents = parseMoneyToCents(input.amount);
    if (!input.description.trim() || !input.category.trim() || !amountCents || amountCents <= 0) return notify("Informe descrição, categoria e valor válidos.", false);
    setState((current) => ({ ...current, expenses: [...current.expenses, { id: createId("expense"), description: input.description.trim(), category: input.category.trim(), amountCents, expenseDate: input.expenseDate, status: "PENDING", paidAt: null, method: null }] }));
    notify("Despesa registrada como pendente.");
  };

  const markExpensePaid = (id: string, method: PaymentMethod) => {
    setState((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, status: "PAID", paidAt: new Date().toISOString(), method } : expense) }));
    notify("Despesa marcada como paga.");
  };

  const cancelExpense = (id: string) => {
    if (!window.confirm("Cancelar esta despesa na demonstração?")) return;
    setState((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, status: "CANCELED" } : expense) }));
    notify("Despesa cancelada.");
  };

  const page = (() => {
    switch (view) {
      case "agenda": return <AgendaView state={state} onAdd={addAppointment} onTransition={transitionAppointment} />;
      case "clients": return <ClientsView clients={state.clients} appointments={state.appointments} onAdd={addClient} onArchive={archiveClient} />;
      case "services": return <ServicesView services={state.services} onAdd={addService} onArchive={archiveService} />;
      case "payments": return <PaymentsView state={state} onAdd={addPayment} onVoid={voidPayment} />;
      case "expenses": return <ExpensesView expenses={state.expenses} onAdd={addExpense} onPay={markExpensePaid} onCancel={cancelExpense} />;
      case "finance": return <FinanceView state={state} />;
      default: return <DashboardView state={state} onNavigate={setView} />;
    }
  })();

  return (
    <div className="app-shell demo-shell">
      <aside className="app-sidebar demo-sidebar">
        <Link href="/" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link>
        <div className="workspace-switcher"><span className="workspace-avatar">D</span><span><small>Ambiente seguro</small><strong>Demonstração</strong></span></div>
        <DemoNavigation view={view} onChange={setView} />
        <div className="sidebar-bottom">
          <Link href="/cadastrar" className="button button-primary button-wide"><Sparkles size={16} aria-hidden="true" />Criar meu espaço</Link>
          <p className="demo-sidebar-note">Dados fictícios e isolados neste navegador.</p>
        </div>
      </aside>
      <div className="app-main">
        <header className="mobile-header"><Link href="/" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link><span className="mobile-user-avatar">D</span></header>
        <div className="mobile-nav-wrap"><DemoNavigation view={view} onChange={setView} /></div>
        <main className="app-content" id="main-content">
          <div className="demo-banner"><div><strong>Modo demonstração</strong><p>Explore livremente. Nada aqui cria conta ou altera dados reais.</p></div><button className="button button-ghost button-small" type="button" onClick={resetDemo}><RotateCcw size={14} aria-hidden="true" />Resetar dados</button></div>
          <div className="app-topline"><div><p className="eyebrow">BeautyFlow para profissionais de beleza</p><p className="card-subtitle">Ambiente interativo com dados fictícios</p></div><Link href="/cadastrar" className="button button-primary">Começar de verdade <ArrowRight size={16} aria-hidden="true" /></Link></div>
          {notice && <p className={notice.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">{notice.message}</p>}
          {page}
        </main>
      </div>
    </div>
  );
}

function DemoNavigation({ view, onChange }: { view: DemoView; onChange: (view: DemoView) => void }) {
  return <nav className="main-nav" aria-label="Navegação da demonstração">{navItems.map(({ view: itemView, label, icon: Icon }) => <button key={itemView} className={`nav-item demo-nav-button${view === itemView ? " nav-item-active" : ""}`} type="button" aria-current={view === itemView ? "page" : undefined} onClick={() => onChange(itemView)}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></button>)}</nav>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StatusBadge({ status }: { status: AppointmentStatus | ExpenseStatus }) {
  const label = status in appointmentStatusLabels ? appointmentStatusLabels[status as AppointmentStatus] : status === "PAID" ? "Paga" : status === "PENDING" ? "Pendente" : "Cancelada";
  return <span className={`status-badge status-${status.toLowerCase().replace("_", "-")}`}>{label}</span>;
}

function DashboardView({ state, onNavigate }: { state: DemoState; onNavigate: (view: DemoView) => void }) {
  const summary = calculateSummary(state);
  const upcoming = [...state.appointments].filter((appointment) => ["SCHEDULED", "CONFIRMED"].includes(appointment.status)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 5);
  return <>
    <PageHeading eyebrow="Visão geral" title="Seu negócio em fluxo." description="Uma visão rápida da agenda, dos recebimentos e do resultado da demonstração." action={<button className="button button-secondary" type="button" onClick={() => onNavigate("agenda")}><Plus size={16} aria-hidden="true" />Novo agendamento</button>} />
    <section className="grid-4"><MetricCard label="Faturamento" value={formatCurrency(summary.revenueCents)} note={`${summary.completedCount} atendimentos concluídos`} icon={<ChartNoAxesCombined size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Recebido" value={formatCurrency(summary.receivedCents)} note="Pagamentos recebidos" icon={<CircleDollarSign size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="A receber" value={formatCurrency(summary.receivableCents)} note="Saldos em aberto" icon={<WalletCards size={18} aria-hidden="true" />} tone="warning" /><MetricCard label="Ticket médio" value={formatCurrency(summary.averageTicketCents)} note="Por atendimento concluído" icon={<ReceiptText size={18} aria-hidden="true" />} /></section>
    <div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Movimento financeiro</h2><p className="card-subtitle">Dados fictícios por semana</p></div><div className="legend"><span><i />Faturamento</span><span><i />Despesas</span></div></div><FinanceChart bars={summary.bars} /></section><section className="card"><div className="card-header"><div><h2 className="card-title">Próximos atendimentos</h2><p className="card-subtitle">Teste alterações de status na Agenda.</p></div><CalendarDays size={18} color="var(--primary)" aria-hidden="true" /></div>{upcoming.length === 0 ? <EmptyState icon={<CalendarDays size={28} aria-hidden="true" />} title="Agenda livre" text="Crie um novo atendimento para testar o fluxo." /> : <div className="list">{upcoming.map((appointment) => <DemoAppointmentRow key={appointment.id} appointment={appointment} state={state} compact />)}</div>}</section></div>
    <section className="card dashboard-callout"><div><p className="eyebrow">Teste sem compromisso</p><h2>Os dados ficam só neste navegador.</h2><p>Crie registros, simule pagamentos e explore os indicadores. Use “Resetar dados” para voltar ao início.</p></div><Link className="button button-primary" href="/cadastrar">Criar conta real <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </>;
}

function ClientsView({ clients, appointments, onAdd, onArchive }: { clients: DemoClient[]; appointments: DemoAppointment[]; onAdd: (input: Omit<DemoClient, "id" | "archived">) => void; onArchive: (id: string) => void }) {
  const activeClients = clients.filter((client) => !client.archived);
  return <><PageHeading eyebrow="Relacionamento" title="Clientes" description={`${activeClients.length} clientes ativos na demonstração.`} /><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Sua base de clientes</h2><p className="card-subtitle">Informações organizadas para o próximo atendimento.</p></div><ContactRound size={18} color="var(--primary)" aria-hidden="true" /></div>{activeClients.length === 0 ? <EmptyState icon={<ContactRound size={28} aria-hidden="true" />} title="Nenhuma cliente ativa" text="Cadastre uma cliente ao lado para continuar." /> : <div className="list">{activeClients.map((client) => <div className="list-row" key={client.id}><div className="list-main"><span className="list-avatar">{client.name.slice(0, 1).toUpperCase()}</span><span className="list-copy"><strong>{client.name}</strong><span>{client.phone || client.email || "Sem contato informado"}</span></span></div><div className="list-value"><span>{stateAppointmentCount(client.id, [])}</span><button className="icon-button" type="button" aria-label={`Arquivar ${client.name}`} title="Arquivar" onClick={() => onArchive(client.id)}><Archive size={15} aria-hidden="true" /></button></div></div>)}</div>}</section><ClientForm onAdd={onAdd} /></div></>;
}

function stateAppointmentCount(clientId: string, appointments: DemoAppointment[]) {
  const count = appointments.filter((appointment) => appointment.clientId === clientId && appointment.status !== "CANCELED").length;
  return `${count} atendimento${count === 1 ? "" : "s"}`;
}

function ClientForm({ onAdd }: { onAdd: (input: Omit<DemoClient, "id" | "archived">) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdd({ name: String(data.get("name") ?? ""), phone: String(data.get("phone") ?? ""), email: String(data.get("email") ?? ""), notes: String(data.get("notes") ?? "") });
    event.currentTarget.reset();
  };
  return <form className="card form-card" onSubmit={submit}><div className="card-header"><div><h2 className="card-title">Nova cliente</h2><p className="card-subtitle">Cadastre um contato fictício para experimentar.</p></div></div><div className="form-grid"><label className="field"><span>Nome</span><input name="name" required placeholder="Marina Oliveira" /></label><label className="field"><span>Telefone</span><input name="phone" type="tel" placeholder="(11) 99999-0000" /></label><label className="field full"><span>E-mail</span><input name="email" type="email" placeholder="voce@exemplo.com" /></label><label className="field full"><span>Observações</span><textarea name="notes" placeholder="Preferências e detalhes importantes." /></label></div><div className="form-actions"><button className="button button-primary" type="submit"><Plus size={16} aria-hidden="true" />Adicionar cliente</button></div></form>;
}

function ServicesView({ services, onAdd, onArchive }: { services: DemoService[]; onAdd: (input: { name: string; description: string; durationMinutes: number; price: string }) => void; onArchive: (id: string) => void }) {
  const activeServices = services.filter((service) => !service.archived);
  return <><PageHeading eyebrow="O que você oferece" title="Serviços" description="Preço e duração ficam prontos para entrar na agenda." /><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Catálogo de serviços</h2><p className="card-subtitle">{activeServices.length} serviços ativos.</p></div><Scissors size={18} color="var(--primary)" aria-hidden="true" /></div>{activeServices.length === 0 ? <EmptyState icon={<Scissors size={28} aria-hidden="true" />} title="Nenhum serviço ativo" text="Crie um serviço ao lado para experimentar." /> : <div className="list">{activeServices.map((service) => <div className="list-row" key={service.id}><div className="list-main"><span className="list-avatar"><Scissors size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{service.name}</strong><span>{service.durationMinutes} min · {service.description || "Sem descrição"}</span></span></div><div className="list-value"><strong>{formatCurrency(service.priceCents)}</strong><button className="icon-button" type="button" aria-label={`Arquivar ${service.name}`} title="Arquivar" onClick={() => onArchive(service.id)}><Archive size={15} aria-hidden="true" /></button></div></div>)}</div>}</section><ServiceForm onAdd={onAdd} /></div></>;
}

function ServiceForm({ onAdd }: { onAdd: (input: { name: string; description: string; durationMinutes: number; price: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdd({ name: String(data.get("name") ?? ""), description: String(data.get("description") ?? ""), durationMinutes: Number(data.get("durationMinutes") ?? 0), price: String(data.get("price") ?? "") });
    event.currentTarget.reset();
  };
  return <form className="card form-card" onSubmit={submit}><div className="card-header"><div><h2 className="card-title">Novo serviço</h2><p className="card-subtitle">O preço será salvo em centavos na aplicação real.</p></div></div><div className="form-grid"><label className="field full"><span>Nome</span><input name="name" required placeholder="Maquiagem social" /></label><label className="field"><span>Duração (minutos)</span><input name="durationMinutes" type="number" min="15" step="15" defaultValue="90" required /></label><label className="field"><span>Preço</span><input name="price" inputMode="decimal" required placeholder="180,00" /></label><label className="field full"><span>Descrição</span><textarea name="description" placeholder="O que está incluído?" /></label></div><div className="form-actions"><button className="button button-primary" type="submit"><Plus size={16} aria-hidden="true" />Adicionar serviço</button></div></form>;
}

function AgendaView({ state, onAdd, onTransition }: { state: DemoState; onAdd: (input: { clientId: string; serviceId: string; date: string; time: string; status: "SCHEDULED" | "CONFIRMED"; notes: string }) => void; onTransition: (id: string, status: AppointmentStatus) => void }) {
  const appointments = [...state.appointments].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return <><PageHeading eyebrow="Seu ritmo" title="Agenda" description="Teste a criação de horários e a proteção contra sobreposições." /><section className="card calendar-card"><div className="calendar-toolbar"><div><strong>Semana demonstrativa · 1 a 7 de setembro</strong><p className="card-subtitle">Uma profissional, com conflito de horário bloqueado.</p></div><div className="legend"><span><i />Confirmado</span><span><i />Agendado</span></div></div><div className="calendar-week">{["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07"].map((date) => { const dayAppointments = appointments.filter((appointment) => appointment.startsAt.slice(0, 10) === date); return <div className="calendar-day" key={date}><div className="calendar-day-label"><span>{new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: APP_TIMEZONE }).format(new Date(`${date}T12:00:00Z`)).replace(".", "")}</span><strong>{date.slice(-2)}</strong></div>{dayAppointments.map((appointment) => <div className="appointment-chip" key={appointment.id}><span>{formatTime(appointment.startsAt)} · {formatTime(appointment.endsAt)}</span><strong>{getClientName(appointment, state)}</strong><span>{getServiceName(appointment, state)}</span></div>)}{dayAppointments.length === 0 && <span className="calendar-empty">Livre</span>}</div>; })}</div></section><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Atendimentos</h2><p className="card-subtitle">Atualize o status conforme o dia avança.</p></div></div>{appointments.length === 0 ? <EmptyState icon={<CalendarDays size={28} aria-hidden="true" />} title="Agenda livre" text="Crie um atendimento ao lado." /> : <div className="list">{appointments.map((appointment) => <DemoAppointmentRow key={appointment.id} appointment={appointment} state={state} onTransition={onTransition} />)}</div>}</section><AppointmentForm clients={state.clients.filter((client) => !client.archived)} services={state.services.filter((service) => !service.archived)} onAdd={onAdd} /></div></>;
}

function AppointmentForm({ clients, services, onAdd }: { clients: DemoClient[]; services: DemoService[]; onAdd: (input: { clientId: string; serviceId: string; date: string; time: string; status: "SCHEDULED" | "CONFIRMED"; notes: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdd({ clientId: String(data.get("clientId") ?? ""), serviceId: String(data.get("serviceId") ?? ""), date: String(data.get("date") ?? ""), time: String(data.get("time") ?? ""), status: data.get("status") === "CONFIRMED" ? "CONFIRMED" : "SCHEDULED", notes: String(data.get("notes") ?? "") });
    event.currentTarget.reset();
  };
  return <form className="card form-card" onSubmit={submit}><div className="card-header"><div><h2 className="card-title">Novo agendamento</h2><p className="card-subtitle">Experimente repetir o mesmo horário para ver a validação.</p></div></div><div className="form-grid"><label className="field"><span>Cliente</span><select name="clientId" required defaultValue=""><option value="" disabled>Selecione...</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label className="field"><span>Serviço</span><select name="serviceId" required defaultValue=""><option value="" disabled>Selecione...</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · {service.durationMinutes} min</option>)}</select></label><label className="field"><span>Data</span><input name="date" type="date" defaultValue="2026-09-07" required /></label><label className="field"><span>Horário</span><input name="time" type="time" step="900" defaultValue="11:00" required /></label><label className="field"><span>Status inicial</span><select name="status" defaultValue="SCHEDULED"><option value="SCHEDULED">Agendado</option><option value="CONFIRMED">Confirmado</option></select></label><label className="field full"><span>Observações</span><textarea name="notes" placeholder="Detalhes do atendimento." /></label></div><div className="form-actions"><button className="button button-primary" type="submit"><Plus size={16} aria-hidden="true" />Criar agendamento</button></div></form>;
}

function DemoAppointmentRow({ appointment, state, onTransition, compact = false }: { appointment: DemoAppointment; state: DemoState; onTransition?: (id: string, status: AppointmentStatus) => void; compact?: boolean }) {
  return <div className="list-row"><div className="list-main"><span className="list-avatar"><CalendarDays size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{formatTime(appointment.startsAt)} · {getClientName(appointment, state)}</strong><span>{getServiceName(appointment, state)} · {formatDateTime(appointment.startsAt)}</span></span></div><div className="list-value"><strong>{formatCurrency(appointment.priceCents)}</strong>{!compact && <><StatusBadge status={appointment.status} />{onTransition && <div className="row-actions">{appointment.status === "SCHEDULED" && <button className="button button-small button-ghost" type="button" onClick={() => onTransition(appointment.id, "CONFIRMED")}><Check size={13} aria-hidden="true" /><span className="desktop-action-label">Confirmar</span></button>}{appointment.status === "CONFIRMED" && <button className="button button-small button-ghost" type="button" onClick={() => onTransition(appointment.id, "COMPLETED")}><CircleCheck size={13} aria-hidden="true" /><span className="desktop-action-label">Concluir</span></button>}{["SCHEDULED", "CONFIRMED"].includes(appointment.status) && <button className="button button-small button-danger" type="button" onClick={() => onTransition(appointment.id, "CANCELED")}><X size={13} aria-hidden="true" /><span className="desktop-action-label">Cancelar</span></button>}</div>}</>}</div></div>;
}

function PaymentsView({ state, onAdd, onVoid }: { state: DemoState; onAdd: (input: { appointmentId: string; amount: string; type: PaymentType; method: PaymentMethod; date: string }) => void; onVoid: (id: string) => void }) {
  const activeAppointments = state.appointments.filter((appointment) => !["CANCELED", "NO_SHOW"].includes(appointment.status));
  const payments = [...state.payments].filter((payment) => payment.status === "RECEIVED").sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  return <><PageHeading eyebrow="Entradas" title="Pagamentos" description="Simule sinal, saldo e valores a receber sem tocar em dados reais." /><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Recebimentos recentes</h2><p className="card-subtitle">Pagamentos recebidos na demonstração.</p></div></div>{payments.length === 0 ? <EmptyState icon={<CircleDollarSign size={28} aria-hidden="true" />} title="Nenhum pagamento" text="Registre um sinal ao lado." /> : <div className="list">{payments.map((payment) => <div className="list-row" key={payment.id}><div className="list-main"><span className="list-avatar"><CircleDollarSign size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{getClientNameByAppointment(payment.appointmentId, state)}</strong><span>{getServiceNameByAppointment(payment.appointmentId, state)} · {methodLabels[payment.method]} · {formatDateOnly(payment.receivedAt)}</span></span></div><div className="list-value"><strong>{formatCurrency(payment.amountCents)}</strong><button className="button button-small button-ghost" type="button" onClick={() => onVoid(payment.id)}><RotateCcw size={13} aria-hidden="true" />Anular</button></div></div>)}</div>}</section><PaymentForm appointments={activeAppointments} state={state} onAdd={onAdd} /></div><section className="card demo-balance-card"><div className="card-header"><div><h2 className="card-title">Saldos dos atendimentos</h2><p className="card-subtitle">O restante pode ser pago depois do sinal.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Cliente</th><th>Atendimento</th><th>Status</th><th className="align-right">Saldo</th></tr></thead><tbody>{activeAppointments.map((appointment) => <tr key={appointment.id}><td>{getClientName(appointment, state)}</td><td>{getServiceName(appointment, state)}</td><td><StatusBadge status={appointment.status} /></td><td className="align-right"><strong>{formatCurrency(Math.max(appointment.priceCents - getReceivedCents(appointment.id, state.payments), 0))}</strong></td></tr>)}</tbody></table></div></section></>;
}

function PaymentForm({ appointments, state, onAdd }: { appointments: DemoAppointment[]; state: DemoState; onAdd: (input: { appointmentId: string; amount: string; type: PaymentType; method: PaymentMethod; date: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdd({ appointmentId: String(data.get("appointmentId") ?? ""), amount: String(data.get("amount") ?? ""), type: data.get("type") as PaymentType, method: data.get("method") as PaymentMethod, date: String(data.get("date") ?? "") });
    event.currentTarget.reset();
  };
  return <form className="card form-card" onSubmit={submit}><div className="card-header"><div><h2 className="card-title">Registrar pagamento</h2><p className="card-subtitle">O valor não pode ultrapassar o saldo em aberto.</p></div></div><div className="form-grid"><label className="field full"><span>Atendimento</span><select name="appointmentId" required defaultValue=""><option value="" disabled>Selecione...</option>{appointments.map((appointment) => <option value={appointment.id} key={appointment.id}>{getClientName(appointment, state)} · {getServiceName(appointment, state)} · saldo {formatCurrency(Math.max(appointment.priceCents - getReceivedCents(appointment.id, state.payments), 0))}</option>)}</select></label><label className="field"><span>Tipo</span><select name="type" defaultValue="DEPOSIT"><option value="DEPOSIT">Sinal</option><option value="BALANCE">Saldo</option><option value="OTHER">Outro</option></select></label><label className="field"><span>Valor</span><input name="amount" inputMode="decimal" required placeholder="100,00" /></label><label className="field"><span>Método</span><select name="method" defaultValue="PIX"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="TRANSFER">TED</option><option value="OTHER">Outro</option></select></label><label className="field"><span>Data</span><input name="date" type="date" defaultValue="2026-09-04" required /></label></div><div className="form-actions"><button className="button button-primary" type="submit"><CircleDollarSign size={16} aria-hidden="true" />Registrar recebimento</button></div></form>;
}

function ExpensesView({ expenses, onAdd, onPay, onCancel }: { expenses: DemoExpense[]; onAdd: (input: { description: string; category: string; amount: string; expenseDate: string }) => void; onPay: (id: string, method: PaymentMethod) => void; onCancel: (id: string) => void }) {
  const visibleExpenses = expenses.filter((expense) => expense.status !== "CANCELED").sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  return <><PageHeading eyebrow="Saídas" title="Despesas" description="Registre contas separadamente e compare competência com caixa." /><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Contas da demonstração</h2><p className="card-subtitle">{visibleExpenses.filter((expense) => expense.status === "PENDING").length} pendentes · {visibleExpenses.filter((expense) => expense.status === "PAID").length} pagas.</p></div><ReceiptText size={18} color="var(--primary)" aria-hidden="true" /></div>{visibleExpenses.length === 0 ? <EmptyState icon={<ReceiptText size={28} aria-hidden="true" />} title="Nenhuma despesa" text="Adicione um custo ao lado para testar." /> : <div className="list">{visibleExpenses.map((expense) => <div className="list-row" key={expense.id}><div className="list-main"><span className="list-avatar">{expense.status === "PENDING" ? <CircleAlert size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</span><span className="list-copy"><strong>{expense.description}</strong><span>{expense.category} · {formatDateOnly(expense.expenseDate)}{expense.paidAt ? " · paga em " + formatDateOnly(expense.paidAt) : ""}</span></span></div><div className="list-value"><strong>{formatCurrency(expense.amountCents)}</strong>{expense.status === "PENDING" ? <ExpensePaymentControl expense={expense} onPay={onPay} onCancel={onCancel} /> : <StatusBadge status={expense.status} />}</div></div>)}</div>}</section><ExpenseForm onAdd={onAdd} /></div></>;
}

function ExpensePaymentControl({ expense, onPay, onCancel }: { expense: DemoExpense; onPay: (id: string, method: PaymentMethod) => void; onCancel: (id: string) => void }) {
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  return <div className="row-actions"><select className="mini-select" value={method} aria-label={`Método de pagamento para ${expense.description}`} onChange={(event) => setMethod(event.target.value as PaymentMethod)}><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="TRANSFER">TED</option><option value="OTHER">Outro</option></select><button className="button button-small button-secondary" type="button" onClick={() => onPay(expense.id, method)}>Pagar</button><button className="icon-button" type="button" aria-label={`Cancelar ${expense.description}`} title="Cancelar" onClick={() => onCancel(expense.id)}><X size={15} aria-hidden="true" /></button></div>;
}

function ExpenseForm({ onAdd }: { onAdd: (input: { description: string; category: string; amount: string; expenseDate: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdd({ description: String(data.get("description") ?? ""), category: String(data.get("category") ?? ""), amount: String(data.get("amount") ?? ""), expenseDate: String(data.get("expenseDate") ?? "") });
    event.currentTarget.reset();
  };
  return <form className="card form-card" onSubmit={submit}><div className="card-header"><div><h2 className="card-title">Nova despesa</h2><p className="card-subtitle">Ela começa como pendente, como no fluxo real.</p></div></div><div className="form-grid"><label className="field full"><span>Descrição</span><input name="description" required placeholder="Compra de materiais" /></label><label className="field"><span>Categoria</span><input name="category" required placeholder="Materiais" /></label><label className="field"><span>Valor</span><input name="amount" inputMode="decimal" required placeholder="85,00" /></label><label className="field full"><span>Data da despesa</span><input name="expenseDate" type="date" defaultValue="2026-09-08" required /></label></div><div className="form-actions"><button className="button button-primary" type="submit"><Plus size={16} aria-hidden="true" />Adicionar despesa</button></div></form>;
}

function FinanceView({ state }: { state: DemoState }) {
  const summary = calculateSummary(state);
  return <><PageHeading eyebrow="Clareza financeira" title="Financeiro" description="Veja faturamento, recebimentos, despesas, lucro e ticket médio." /><section className="grid-4"><MetricCard label="Faturamento" value={formatCurrency(summary.revenueCents)} note="Atendimentos concluídos" icon={<ChartNoAxesCombined size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Recebido" value={formatCurrency(summary.receivedCents)} note="Pagamentos recebidos" icon={<CircleDollarSign size={18} aria-hidden="true" />} tone="positive" /><MetricCard label="Despesas" value={formatCurrency(summary.accruedExpensesCents)} note={`${formatCurrency(summary.paidExpensesCents)} já pagas`} icon={<CircleAlert size={18} aria-hidden="true" />} tone="warning" /><MetricCard label="A receber" value={formatCurrency(summary.receivableCents)} note="Saldos dos atendimentos" icon={<WalletCards size={18} aria-hidden="true" />} /></section><div className="dashboard-grid"><section className="card"><div className="card-header"><div><h2 className="card-title">Movimento por semana</h2><p className="card-subtitle">Competência da demonstração</p></div><div className="legend"><span><i />Faturamento</span><span><i />Despesas</span></div></div><FinanceChart bars={summary.bars} /></section><section className="card"><div className="card-header"><div><h2 className="card-title">Competência x caixa</h2><p className="card-subtitle">Dois jeitos complementares de acompanhar o negócio.</p></div></div><div className="finance-detail"><div><span>Lucro por competência</span><strong>{formatCurrency(summary.competenceProfitCents)}</strong><small>Faturamento - despesas registradas</small></div><div><span>Resultado de caixa</span><strong>{formatCurrency(summary.cashResultCents)}</strong><small>Recebido - despesas pagas</small></div><div><span>Ticket médio</span><strong>{formatCurrency(summary.averageTicketCents)}</strong><small>Por atendimento concluído</small></div><div><span>Despesas pendentes</span><strong>{formatCurrency(summary.pendingExpensesCents)}</strong><small>Contas ainda não pagas</small></div></div></section></div></>;
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="empty-state">{icon}<strong>{title}</strong><p>{text}</p></div>;
}

function getClientName(appointment: DemoAppointment, state: DemoState) {
  return state.clients.find((client) => client.id === appointment.clientId)?.name ?? "Cliente arquivada";
}

function getServiceName(appointment: DemoAppointment, state: DemoState) {
  return state.services.find((service) => service.id === appointment.serviceId)?.name ?? "Serviço arquivado";
}

function getClientNameByAppointment(appointmentId: string, state: DemoState) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  return appointment ? getClientName(appointment, state) : "Cliente";
}

function getServiceNameByAppointment(appointmentId: string, state: DemoState) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  return appointment ? getServiceName(appointment, state) : "Serviço";
}
