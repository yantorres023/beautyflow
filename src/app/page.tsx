import Link from "next/link";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Sparkles } from "lucide-react";

const highlights = [
  { icon: CalendarDays, title: "Agenda clara", text: "Veja sua semana e evite horários conflitantes." },
  { icon: ChartNoAxesCombined, title: "Caixa sob controle", text: "Saiba o que entrou, saiu e ainda está para receber." },
  { icon: Sparkles, title: "Mais leveza", text: "Menos planilhas, mais presença em cada atendimento." },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/" className="brand-mark"><span className="brand-dot" />BeautyFlow</Link>
        <div className="landing-nav-actions"><Link href="/entrar" className="button button-ghost">Entrar</Link><Link href="/cadastrar" className="button button-primary">Começar agora <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </nav>
      <section className="landing-hero page-container">
        <div className="hero-copy">
          <p className="eyebrow">Gestão feita para quem transforma</p>
          <h1>Seu talento no centro. Sua gestão no fluxo.</h1>
          <p className="hero-lede">O BeautyFlow reúne agenda, clientes e finanças para você trabalhar com mais clareza e tranquilidade.</p>
          <div className="hero-actions"><Link href="/cadastrar" className="button button-primary button-large">Criar meu espaço <ArrowRight size={18} aria-hidden="true" /></Link><span className="hero-note">Comece com o essencial.</span></div>
        </div>
        <div className="hero-preview" aria-label="Prévia do dashboard BeautyFlow">
          <div className="preview-top"><div><span className="preview-kicker">Visão do mês</span><strong>Seu BeautyFlow</strong></div><span className="preview-avatar">M</span></div>
          <div className="preview-metrics"><div><span>Faturamento</span><strong>R$ 8.420</strong><small>+12,4% no período</small></div><div><span>Agenda</span><strong>18</strong><small>atendimentos</small></div></div>
          <div className="preview-chart"><div className="chart-labels"><span>Entradas e despesas</span><span>Mai 2025</span></div><div className="chart-bars" aria-hidden="true"><i style={{ height: "40%" }} /><i style={{ height: "58%" }} /><i style={{ height: "48%" }} /><i style={{ height: "76%" }} /><i style={{ height: "66%" }} /><i style={{ height: "88%" }} /><i style={{ height: "70%" }} /></div></div>
          <div className="preview-next"><span className="preview-kicker">Próximo atendimento</span><strong>10:00 · Ana Souza</strong><span>Maquiagem social · 1h30</span></div>
        </div>
      </section>
      <section className="landing-highlights page-container">{highlights.map(({ icon: Icon, title, text }) => <article className="highlight" key={title}><span className="highlight-icon"><Icon size={19} aria-hidden="true" /></span><h2>{title}</h2><p>{text}</p></article>)}</section>
      <footer className="landing-footer page-container"><span>BeautyFlow</span><span>Feito para a beleza acontecer.</span></footer>
    </main>
  );
}
