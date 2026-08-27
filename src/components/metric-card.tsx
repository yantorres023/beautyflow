import type { ReactNode } from "react";

export function MetricCard({ label, value, note, icon, tone = "default" }: { label: string; value: string; note: string; icon: ReactNode; tone?: "default" | "positive" | "warning" }) {
  return <article className={`card metric-card metric-${tone}`}><div className="metric-icon">{icon}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className={`metric-foot${tone === "default" ? " neutral" : ""}`}>{note}</span></article>;
}
