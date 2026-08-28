import { z } from "zod";

export const publicBookingSchema = z.object({
  organizationSlug: z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/i, "Link de agendamento inválido."),
  name: z.string().trim().min(2, "Informe seu nome.").max(160),
  phone: z.string().trim().min(8, "Informe um telefone para contato.").max(32),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").optional().or(z.literal("")),
  serviceId: z.string().uuid("Escolha um serviço."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido."),
  notes: z.string().trim().max(1000, "Escreva no máximo 1.000 caracteres.").optional(),
});
