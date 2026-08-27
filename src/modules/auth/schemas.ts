import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(160),
  email: emailSchema,
  password: passwordSchema,
  organizationName: z.string().trim().min(2, "Informe o nome do espaço.").max(160),
});

export const requestResetSchema = z.object({ email: emailSchema });

export const tokenSchema = z.string().trim().min(32);
