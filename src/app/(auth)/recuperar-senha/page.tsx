import Link from "next/link";
import { RequestResetForm } from "@/modules/auth/components";

export default function ForgotPasswordPage() {
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Acesso seguro</p>
        <h2>Recupere sua senha</h2>
        <p>Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
      </div>
      <RequestResetForm />
      <p className="auth-switch"><Link href="/entrar">Voltar para o login</Link></p>
    </div>
  );
}
