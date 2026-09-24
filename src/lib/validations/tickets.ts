import { z } from "zod"
import { optionalLongText } from "@/lib/validations/fields"

export const ticketSchema = z.object({
  subject: z.string().trim().min(1, "Informe o assunto").max(200),
  details: optionalLongText,
  status: z.coerce.number().int().min(1).max(6).default(1),
  priority: z.coerce.number().int().min(1).max(4).default(2),
  type: z.coerce.number().int().min(1).max(4).default(3),
  department_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
})

export type TicketInput = z.infer<typeof ticketSchema>

export const ticketReplySchema = z.object({
  body: z.string().trim().min(1, "Escreva uma resposta").max(5000),
  is_internal: z.boolean().default(false),
})

export type TicketReplyInput = z.infer<typeof ticketReplySchema>
