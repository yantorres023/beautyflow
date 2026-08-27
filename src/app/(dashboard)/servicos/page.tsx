import { Archive, Scissors } from "lucide-react";
import { ServiceForm } from "@/modules/services/components";
import { archiveServiceAction } from "@/modules/services/actions";
import { formatCurrency } from "@/lib/money";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

export default async function ServicesPage() {
  const context = await requireAuthContext();
  const services = await db.service.findMany({ where: { organizationId: context.organization.id, archivedAt: null, isActive: true }, orderBy: { name: "asc" } });

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Seu catálogo</p><h1>Serviços</h1><p>Defina o que você oferece e deixe a agenda calcular o tempo certo.</p></div><span className="status-badge status-confirmed">{services.length} ativos</span></div>
      <div className="dashboard-grid">
        <section className="card"><div className="card-header"><div><h2 className="card-title">Catálogo ativo</h2><p className="card-subtitle">Serviços disponíveis para novos agendamentos.</p></div></div>
          {services.length === 0 ? <div className="empty-state"><Scissors size={30} aria-hidden="true" /><strong>Nenhum serviço cadastrado</strong><p>Adicione o primeiro serviço para começar a montar sua agenda.</p></div> : <div className="list">{services.map((service) => <div className="list-row" key={service.id}><div className="list-main"><span className="list-avatar"><Scissors size={16} aria-hidden="true" /></span><span className="list-copy"><strong>{service.name}</strong><span>{service.durationMinutes} min · {service.description ?? "Sem descrição"}</span></span></div><div className="list-value">{formatCurrency(service.priceCents)}<form action={archiveServiceAction} style={{ marginTop: 6 }}><input type="hidden" name="id" value={service.id} /><button className="button button-small button-ghost" type="submit"><Archive size={14} aria-hidden="true" />Arquivar</button></form></div></div>)}</div>}
        </section>
        <ServiceForm />
      </div>
    </>
  );
}
