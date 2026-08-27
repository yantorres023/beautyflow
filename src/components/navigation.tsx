"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { CalendarDays, ChartNoAxesCombined, CircleDollarSign, ContactRound, LayoutDashboard, Scissors, WalletCards } from "lucide-react";

const items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: ContactRound },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/pagamentos", label: "Pagamentos", icon: CircleDollarSign },
  { href: "/despesas", label: "Despesas", icon: WalletCards },
  { href: "/financeiro", label: "Financeiro", icon: ChartNoAxesCombined },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="Navegação principal">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={`nav-item${active ? " nav-item-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
