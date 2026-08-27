import { Resend } from "resend";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(input: { to: string; name: string; token: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[BeautyFlow] Verification URL: ${appUrl}/verificar-email?token=${input.token}`);
      return true;
    }

    return false;
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: "Confirme seu e-mail no BeautyFlow",
    html: `<p>Olá, ${input.name}!</p><p>Confirme seu e-mail para começar a usar o BeautyFlow:</p><p><a href="${appUrl}/verificar-email?token=${input.token}">Confirmar e-mail</a></p>`,
  });

  return !result.error;
}

export async function sendPasswordResetEmail(input: { to: string; name: string; token: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[BeautyFlow] Password reset URL: ${appUrl}/redefinir-senha?token=${input.token}`);
      return true;
    }

    return false;
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: "Redefina sua senha do BeautyFlow",
    html: `<p>Olá, ${input.name}!</p><p>Use o link abaixo para redefinir sua senha:</p><p><a href="${appUrl}/redefinir-senha?token=${input.token}">Redefinir senha</a></p>`,
  });

  return !result.error;
}
