import Link from "next/link";
import { VerifyEmailForm } from "@/modules/auth/components";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Quase lá</p>
        <h2>Confirme seu e-mail</h2>
        <p>{params.email ? `Enviamos um link de confirmação para ${params.email}.` : "Use o link recebido por e-mail para ativar sua conta."}</p>
      </div>
      {params.token ? <VerifyEmailForm token={params.token} /> : <p className="form-footnote">Abra o link enviado para concluir o cadastro. Em desenvolvimento, o link aparece no terminal.</p>}
      <p className="auth-switch"><Link href="/entrar">Ir para o login</Link></p>
    </div>
  );
}
