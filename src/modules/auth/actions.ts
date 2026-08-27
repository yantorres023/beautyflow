"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import argon2 from "argon2";
import { db } from "@/server/db";
import { signIn, signOut } from "@/../auth";
import { errorState, successState, type ActionState } from "@/lib/action-result";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { registerSchema, requestResetSchema, tokenSchema } from "@/modules/auth/schemas";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/server/mailer";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(([, messages]) => messages?.length),
  ) as Record<string, string[]>;
}

function createRawToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function slugify(value: string) {
  return `${value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150)}-${randomBytes(3).toString("hex")}`;
}

export async function registerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return errorState("Revise os dados informados.", fieldErrors(parsed.error));
  }

  const existingUser = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (existingUser) {
    return errorState("Não foi possível criar a conta com esses dados.", { email: ["Esse e-mail já está em uso."] });
  }

  const passwordHash = await argon2.hash(parsed.data.password);
  const rawToken = createRawToken();

  const user = await db.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });

    const organization = await transaction.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug: slugify(parsed.data.organizationName),
        currencyCode: "BRL",
        timezone: "America/Sao_Paulo",
      },
    });

    await transaction.organizationMember.create({
      data: {
        userId: createdUser.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    await transaction.authToken.create({
      data: {
        userId: createdUser.id,
        purpose: "EMAIL_VERIFICATION",
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return createdUser;
  });

  const emailSent = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
  });

  if (!emailSent) {
    return errorState("A conta foi criada, mas não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.");
  }

  redirect(`/verificar-email?email=${encodeURIComponent(user.email)}`);
}

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = formData.get("password");
  const callbackUrl = typeof formData.get("callbackUrl") === "string" ? formData.get("callbackUrl") as string : "/dashboard";
  const safeCallbackUrl = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";

  if (!email.success || typeof password !== "string" || !password) {
    return errorState("Informe e-mail e senha para entrar.");
  }

  try {
    await signIn("credentials", {
      email: email.data,
      password,
      redirectTo: safeCallbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorState("E-mail ou senha inválidos. Confirme seu e-mail antes de entrar.");
    }

    throw error;
  }

  return successState("Login realizado.");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/entrar" });
}

export async function requestPasswordResetAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return errorState("Informe um e-mail válido.", fieldErrors(parsed.error));
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (user && user.emailVerifiedAt) {
    const rawToken = createRawToken();
    await db.authToken.deleteMany({ where: { userId: user.id, purpose: "PASSWORD_RESET", usedAt: null } });
    await db.authToken.create({
      data: {
        userId: user.id,
        purpose: "PASSWORD_RESET",
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail({ to: user.email, name: user.name, token: rawToken });
  }

  return successState("Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.");
}

export async function verifyEmailAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = tokenSchema.safeParse(formData.get("token"));

  if (!parsed.success) {
    return errorState("Link de confirmação inválido.");
  }

  const token = await db.authToken.findFirst({
    where: {
      tokenHash: hashToken(parsed.data),
      purpose: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!token) {
    return errorState("Esse link é inválido ou expirou.");
  }

  const verified = await db.$transaction(async (transaction) => {
    const consumed = await transaction.authToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;

    await transaction.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });
    return true;
  });

  if (!verified) return errorState("Esse link é inválido ou expirou.");

  redirect("/entrar?verified=1");
}

export async function resetPasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const token = tokenSchema.safeParse(formData.get("token"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");

  if (!token.success || !password.success || password.data !== confirmation) {
    return errorState("Confira o link e informe duas senhas iguais.");
  }

  const resetToken = await db.authToken.findFirst({
    where: {
      tokenHash: hashToken(token.data),
      purpose: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetToken) {
    return errorState("Esse link é inválido ou expirou.");
  }

  const passwordHash = await argon2.hash(password.data);

  const reset = await db.$transaction(async (transaction) => {
    const consumed = await transaction.authToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    return true;
  });

  if (!reset) return errorState("Esse link é inválido ou expirou.");

  redirect("/entrar?reset=1");
}
