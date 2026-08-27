import Link from "next/link";
import { ResetPasswordForm } from "@/modules/auth/components";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Acesso seguro</p>
        <h2>Crie uma nova senha</h2>
        <p>Escolha uma senha forte para voltar ao seu espaço.</p>
      </div>
      {params.token ? <ResetPasswordForm token={params.token} /> : <p className="feedback feedback-error">Link de recuperação ausente ou inválido.</p>}
      <p className="auth-switch"><Link href="/entrar">Voltar para o login</Link></p>
    </div>
  );
}
