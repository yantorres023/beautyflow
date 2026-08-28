import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { publicBookingTokenSchema } from "@/modules/public-booking/schemas";
import { hashPublicBookingToken } from "@/modules/public-booking/tokens";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const statusCopy = {
  SCHEDULED: {
    title: "Pedido recebido",
    description: "A profissional ainda precisa confirmar este horário. Atualize esta página para consultar o andamento.",
    icon: Clock3,
    tone: "pending",
  },
  CONFIRMED: {
    title: "Horário confirmado",
    description: "Tudo certo! Seu atendimento foi aceito pela profissional.",
    icon: CheckCircle2,
    tone: "confirmed",
  },
  COMPLETED: {
    title: "Atendimento concluído",
    description: "Este atendimento já foi marcado como concluído.",
    icon: CheckCircle2,
    tone: "confirmed",
  },
  CANCELED: {
    title: "Pedido cancelado",
    description: "Este horário não está mais reservado. Entre em contato com o espaço se precisar de ajuda.",
    icon: XCircle,
    tone: "canceled",
  },
  NO_SHOW: {
    title: "Atendimento não realizado",
    description: "Este atendimento foi marcado como não realizado pela profissional.",
    icon: XCircle,
    tone: "canceled",
  },
} as const;

export default async function PublicBookingStatusPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug: rawSlug, token } = await params;
  const parsedToken = publicBookingTokenSchema.safeParse(token);
  if (!parsedToken.success) notFound();

  const organization = await db.organization.findFirst({
    where: { slug: rawSlug.toLowerCase(), archivedAt: null },
    select: { id: true, name: true, slug: true, timezone: true },
  });
  if (!organization) notFound();

  const appointment = await db.appointment.findFirst({
    where: { organizationId: organization.id, publicBookingTokenHash: hashPublicBookingToken(parsedToken.data) },
    select: {
      startsAt: true,
      endsAt: true,
      priceCents: true,
      status: true,
      client: { select: { name: true } },
      service: { select: { name: true } },
    },
  });
  if (!appointment) notFound();

  const copy = statusCopy[appointment.status];
  const StatusIcon = copy.icon;

  return (
    <main className="public-booking-shell">
      <div className="public-booking-container public-status-container">
        <header className="public-booking-header"><Link href={`/agendar/${organization.slug}`} className="brand-mark"><span className="brand-dot" />BeautyFlow</Link><span>Acompanhamento do pedido</span></header>
        <section className="card public-status-card">
          <div className={`public-status-icon public-status-${copy.tone}`}><StatusIcon size={28} aria-hidden="true" /></div>
          <p className="eyebrow">Agendamento online</p>
          <h1>{copy.title}</h1>
          <p className="public-status-description">{copy.description}</p>
          <div className="public-status-summary">
            <div><span>Cliente</span><strong>{appointment.client.name}</strong></div>
            <div><span>Serviço</span><strong>{appointment.service.name}</strong></div>
            <div><span>Data e horário</span><strong>{formatDateTime(appointment.startsAt, organization.timezone)}</strong></div>
            <div><span>Valor</span><strong>{formatCurrency(appointment.priceCents)}</strong></div>
          </div>
          <p className="field-hint">O link é o canal principal e mostra sempre o status mais recente. O envio de e-mail é apenas opcional e depende da configuração do provedor.</p>
          <div className="public-status-actions"><Link href={`/agendar/${organization.slug}`} className="button button-primary"><ArrowLeft size={16} aria-hidden="true" />Voltar para o agendamento</Link><span><CalendarDays size={15} aria-hidden="true" />{organization.name}</span></div>
        </section>
        <footer className="public-booking-footer"><span>Powered by BeautyFlow</span><Link href="/cadastrar">Quer organizar seu espaço?</Link></footer>
      </div>
    </main>
  );
}
