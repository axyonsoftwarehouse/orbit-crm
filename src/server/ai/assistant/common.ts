import { tool, type InferUITools, type UIMessage } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"
import {
  draftEmailInputSchema,
  draftEmailOutputSchema,
  draftReplyInputSchema,
  draftReplyOutputSchema,
  proposeTaskInputSchema,
  proposeTaskOutputSchema,
} from "@/lib/ai/assistant-schemas"

export const ROW_LIMIT = 20
export const QUERY_ERROR = {
  error: "Não foi possível consultar os dados.",
} as const
export const noInput = z.object({})

export function label(
  map: Record<number, { label: string }>,
  value: number | null,
) {
  return value == null ? null : (map[value]?.label ?? String(value))
}

export function failTool(name: string, error: { message?: string }) {
  logger.error("ai.assistant_tool_failed", { tool: name, error: error.message })
  return QUERY_ERROR
}

/** Sem `execute`: o cartão na tela resolve (criar ou descartar). */
export function proposeTaskTool(description: string) {
  return tool({
    description,
    inputSchema: proposeTaskInputSchema,
    outputSchema: proposeTaskOutputSchema,
  })
}

/** Sem `execute`: o cartão mostra o rascunho para copiar. */
export function draftEmailTool() {
  return tool({
    description:
      "Mostra um rascunho de e-mail (destinatário, assunto, corpo) para o usuário copiar. Nada é enviado.",
    inputSchema: draftEmailInputSchema,
    outputSchema: draftEmailOutputSchema,
  })
}

/** Sem `execute`: o cartão mostra a resposta de ticket para copiar. */
export function draftReplyTool() {
  return tool({
    description:
      "Mostra um rascunho de resposta ao cliente para o usuário revisar e copiar. Nada é publicado no ticket.",
    inputSchema: draftReplyInputSchema,
    outputSchema: draftReplyOutputSchema,
  })
}

/** Ferramentas resolvidas na tela (cartões); as de consulta não aparecem. */
type CardTools = {
  proposeTask: ReturnType<typeof proposeTaskTool>
  draftEmail: ReturnType<typeof draftEmailTool>
  draftReply: ReturnType<typeof draftReplyTool>
}

export type AssistantUIMessage = UIMessage<
  unknown,
  never,
  InferUITools<CardTools>
>
