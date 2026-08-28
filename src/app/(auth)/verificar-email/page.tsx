import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Cadastro simplificado</p>
        <h2>Confirmação pausada</h2>
        <p>O BeautyFlow não exige confirmação de e-mail por enquanto. Sua conta já pode ser acessada diretamente após o cadastro.</p>
      </div>
      <Link className="button button-primary button-wide" href="/entrar">Ir para o login</Link>
    </div>
  );
}
