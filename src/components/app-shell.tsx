import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Plus } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { logoutAction } from "@/modules/auth/actions";
import { requireAuthContext } from "@/server/auth-context";

export async function AppShell({ children }: { children: ReactNode }) {
  const context = await requireAuthContext();

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <aside className="app-sidebar">
        <Link href="/dashboard" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link>
        <div className="workspace-switcher"><span className="workspace-avatar">{context.organization.name.slice(0, 1).toUpperCase()}</span><span><small>Seu espaço</small><strong>{context.organization.name}</strong></span></div>
        <Navigation />
        <div className="sidebar-bottom">
          <div className="sidebar-user"><span className="user-avatar">{context.user.name.slice(0, 1).toUpperCase()}</span><span><strong>{context.user.name}</strong><small>{context.user.email}</small></span></div>
          <form action={logoutAction}><button className="logout-button" type="submit"><LogOut size={16} aria-hidden="true" />Sair</button></form>
        </div>
      </aside>
      <div className="app-main">
        <header className="mobile-header"><Link href="/dashboard" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link><span className="mobile-user-avatar">{context.user.name.slice(0, 1).toUpperCase()}</span></header>
        <div className="mobile-nav-wrap"><Navigation /></div>
        <main className="app-content" id="main-content">
          <div className="app-topline"><div><p className="eyebrow">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date())}</p></div><Link href="/agenda?novo=1" className="button button-primary"><Plus size={17} aria-hidden="true" />Novo agendamento</Link></div>
          {children}
        </main>
      </div>
    </div>
  );
}
