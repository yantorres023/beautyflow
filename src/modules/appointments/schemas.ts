import { z } from "zod";

export const appointmentSchema = z.object({
  clientId: z.string().uuid("Selecione uma cliente."),
  serviceId: z.string().uuid("Selecione um serviço."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido."),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELED", "NO_SHOW"]),
  notes: z.string().trim().max(2000).optional(),
});
