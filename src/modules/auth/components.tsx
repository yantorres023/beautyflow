"use client";

import Link from "next/link";
import { useActionState } from "react";
import { initialActionState } from "@/lib/action-result";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  verifyEmailAction,
} from "@/modules/auth/actions";

function Feedback({ state }: { state: { ok: boolean; message?: string } }) {
  if (!state.message) return null;
  return (
    <p className={state.ok ? "feedback feedback-success" : "feedback feedback-error"} role="status">
      {state.message}
    </p>
  );
}

function Field({ label, name, type = "text", placeholder, required = true, autoComplete }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; autoComplete?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete ?? (type === "password" ? "new-password" : name)} />
    </label>
  );
}

export function LoginForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="E-mail" name="email" type="email" placeholder="voce@exemplo.com" />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" />
      <Feedback state={state} />
      <button className="button button-primary button-wide" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
      <Link className="form-link" href="/recuperar-senha">Esqueci minha senha</Link>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <Field label="Seu nome" name="name" placeholder="Marina Oliveira" />
      <Field label="Nome do espaço" name="organizationName" placeholder="Studio Marina" />
      <Field label="E-mail" name="email" type="email" placeholder="voce@exemplo.com" />
      <Field label="Senha" name="password" type="password" />
      <p className="field-hint">Use pelo menos 12 caracteres.</p>
      <Feedback state={state} />
      <button className="button button-primary button-wide" disabled={pending}>{pending ? "Criando..." : "Criar minha conta"}</button>
      <p className="form-footnote">Você receberá um link para confirmar seu e-mail.</p>
    </form>
  );
}

export function RequestResetForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <Field label="E-mail" name="email" type="email" placeholder="voce@exemplo.com" />
      <Feedback state={state} />
      <button className="button button-primary button-wide" disabled={pending}>{pending ? "Enviando..." : "Enviar instruções"}</button>
    </form>
  );
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <button className="button button-primary button-wide" disabled={pending}>{pending ? "Confirmando..." : "Confirmar e-mail"}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" name="password" type="password" />
      <Field label="Confirme a senha" name="confirmation" type="password" />
      <Feedback state={state} />
      <button className="button button-primary button-wide" disabled={pending}>{pending ? "Salvando..." : "Redefinir senha"}</button>
    </form>
  );
}
