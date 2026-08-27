import { ContactRound, Archive } from "lucide-react";
import { ClientForm } from "@/modules/clients/components";
import { archiveClientAction } from "@/modules/clients/actions";
import { db } from "@/server/db";
import { requireAuthContext } from "@/server/auth-context";

export default async function ClientsPage() {
  const context = await requireAuthContext();
  const clients = await db.client.findMany({ where: { organizationId: context.organization.id, archivedAt: null }, orderBy: { name: "asc" } });

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Relacionamento</p><h1>Clientes</h1><p>Uma base organizada para lembrar quem torna seu trabalho possível.</p></div><span className="status-badge status-confirmed">{clients.length} ativas</span></div>
      <div className="dashboard-grid">
        <section className="card"><div className="card-header"><div><h2 className="card-title">Sua base</h2><p className="card-subtitle">Clientes ativos no BeautyFlow.</p></div></div>
          {clients.length === 0 ? <div className="empty-state"><ContactRound size={30} aria-hidden="true" /><strong>Nenhuma cliente cadastrada</strong><p>Comece adicionando sua primeira cliente ao lado.</p></div> : <div className="list">{clients.map((client) => <div className="list-row" key={client.id}><div className="list-main"><span className="list-avatar">{client.name.slice(0, 1).toUpperCase()}</span><span className="list-copy"><strong>{client.name}</strong><span>{client.phone ?? client.email ?? "Sem contato informado"}</span></span></div><form action={archiveClientAction}><input type="hidden" name="id" value={client.id} /><button className="icon-button" type="submit" aria-label={`Arquivar ${client.name}`} title="Arquivar"><Archive size={16} aria-hidden="true" /></button></form></div>)}</div>}
        </section>
        <ClientForm />
      </div>
    </>
  );
}
