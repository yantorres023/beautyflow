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

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendAppointmentConfirmationEmail(input: {
  to: string;
  clientName: string;
  serviceName: string;
  startsAt: Date | string;
  timezone: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const scheduledAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: input.timezone,
  }).format(new Date(input.startsAt));

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[BeautyFlow] Appointment confirmation email for ${input.to}: ${scheduledAt}`);
      return true;
    }

    return false;
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: "Seu horário foi confirmado",
    html: `<p>Olá, ${escapeHtml(input.clientName)}!</p><p>Seu horário para <strong>${escapeHtml(input.serviceName)}</strong> foi confirmado para ${scheduledAt}.</p><p>Até lá!</p>`,
  });

  return !result.error;
}
