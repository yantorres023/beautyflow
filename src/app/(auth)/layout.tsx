import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Link href="/" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link>
        <div className="auth-brand-copy">
          <p className="eyebrow">Seu espaço, mais leve</p>
          <h1>Mais tempo para criar beleza.</h1>
          <p>Organize seus atendimentos, acompanhe seu caixa e cuide das suas clientes em um só lugar.</p>
        </div>
        <p className="auth-brand-note">Agenda · Clientes · Finanças</p>
      </section>
      <section className="auth-content">{children}</section>
    </main>
  );
}
