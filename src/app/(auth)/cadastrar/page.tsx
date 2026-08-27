import Link from "next/link";
import { RegisterForm } from "@/modules/auth/components";

export default function RegisterPage() {
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <p className="eyebrow">Comece hoje</p>
        <h2>Crie seu espaço</h2>
        <p>Um lugar simples para organizar sua agenda e enxergar o resultado do seu trabalho.</p>
      </div>
      <RegisterForm />
      <p className="auth-switch">Já tem uma conta? <Link href="/entrar">Entrar</Link></p>
    </div>
  );
}
