import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.");
export const passwordSchema = z.string().min(12, "A senha deve ter pelo menos 12 caracteres.");

export function stringOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
