import Link from "next/link";
import { LoginForm } from "@/modules/auth/components";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; registered?: string; verified?: string; reset?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Bem-vinda de volta</p>
        <h2>Entre no BeautyFlow</h2>
        <p>Continue de onde parou e mantenha seu dia sob controle.</p>
      </div>
      {params.registered === "1" && <p className="feedback feedback-success" role="status">Conta criada. Você já pode entrar sem confirmar o e-mail.</p>}
      {params.verified === "1" && <p className="feedback feedback-success" role="status">E-mail confirmado. Agora você já pode entrar.</p>}
      {params.reset === "1" && <p className="feedback feedback-success" role="status">Senha atualizada. Entre com a nova senha.</p>}
      <LoginForm callbackUrl={params.callbackUrl ?? "/dashboard"} />
      <p className="auth-switch">Ainda não tem conta? <Link href="/cadastrar">Crie seu espaço</Link></p>
    </div>
  );
}
