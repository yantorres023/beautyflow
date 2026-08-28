import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock3, Scissors } from "lucide-react";
import { toDateInputValue } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { PublicBookingForm } from "@/modules/public-booking/components";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const organization = await db.organization.findFirst({
    where: { slug, archivedAt: null },
    select: {
      name: true,
      slug: true,
      timezone: true,
      services: {
        where: { archivedAt: null, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, durationMinutes: true, priceCents: true },
      },
    },
  });

  if (!organization) notFound();

  const minDate = toDateInputValue(new Date(), organization.timezone);
  return (
    <main className="public-booking-shell">
      <div className="public-booking-container">
        <header className="public-booking-header"><Link href="/" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link><span>Agendamento online</span></header>
        <section className="public-booking-hero"><p className="eyebrow">Agende com {organization.name}</p><h1>Seu próximo momento começa aqui.</h1><p>Escolha um serviço, encontre um horário que combina com você e envie sua solicitação em poucos passos.</p><div className="public-booking-assurance"><span><Check size={15} aria-hidden="true" />Sem cadastro</span><span><Clock3 size={15} aria-hidden="true" />Resposta do espaço</span><span><Scissors size={15} aria-hidden="true" />Serviços e valores claros</span></div></section>
        {organization.services.length === 0 ? <section className="card public-booking-empty"><Scissors size={30} aria-hidden="true" /><h2>Agendamentos temporariamente indisponíveis</h2><p>Este espaço ainda não cadastrou serviços para reserva online.</p><Link href="/" className="button button-secondary"><ArrowLeft size={16} aria-hidden="true" />Voltar ao BeautyFlow</Link></section> : <div className="public-booking-grid"><section className="public-services-panel"><div className="public-section-heading"><p className="eyebrow">O que você procura?</p><h2>Serviços disponíveis</h2><p>Veja duração e valor antes de escolher seu horário.</p></div><div className="public-service-list">{organization.services.map((service) => <article className="public-service-card" key={service.id}><span className="public-service-icon"><Scissors size={18} aria-hidden="true" /></span><div><h3>{service.name}</h3><p>{service.description || "Atendimento personalizado para você."}</p><div className="public-service-meta"><span><Clock3 size={14} aria-hidden="true" />{service.durationMinutes} min</span><strong>{formatCurrency(service.priceCents)}</strong></div></div></article>)}</div><p className="public-booking-window">Escolha uma data futura. O horário será confirmado pela profissional.</p></section><PublicBookingForm organizationSlug={organization.slug} services={organization.services} minDate={minDate} /></div>}
        <footer className="public-booking-footer"><span>Powered by BeautyFlow</span><Link href="/cadastrar">Quer organizar seu espaço?</Link></footer>
      </div>
    </main>
  );
}
