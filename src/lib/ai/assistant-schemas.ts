import { z } from "zod"

/** Entrada da ferramenta `proposeTask` (preenchida pela IA, revisada no cartão). */
export const proposeTaskInputSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  priority: z.number().int().min(1).max(4).default(2),
})

export type ProposeTaskInput = z.infer<typeof proposeTaskInputSchema>

/** Entrada da ferramenta `draftEmail` (apenas rascunho, nada é enviado). */
export const draftEmailInputSchema = z.object({
  to_name: z.string().optional(),
  to_email: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
})

export type DraftEmailInput = z.infer<typeof draftEmailInputSchema>

/** O que o usuário confirma no cartão de tarefa. */
export const assistantTaskSchema = proposeTaskInputSchema.extend({
  company_id: z.string().uuid(),
  assignee_id: z.string().uuid().optional(),
})

export type AssistantTaskInput = z.infer<typeof assistantTaskSchema>

export const proposeTaskOutputSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("created"), taskId: z.string() }),
  z.object({ status: z.literal("discarded") }),
  z.object({ status: z.literal("error"), message: z.string() }),
])

export type ProposeTaskOutput = z.infer<typeof proposeTaskOutputSchema>

export const draftEmailOutputSchema = z.object({ status: z.literal("shown") })

export type DraftEmailOutput = z.infer<typeof draftEmailOutputSchema>
