import { convertToModelMessages, stepCountIs, streamText } from "ai"
import { z } from "zod"
import { getProfile, getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { getCompany } from "@/server/queries/companies"
import { getChatModel, isAiConfigured } from "@/server/ai/model"
import { checkAiRateLimit } from "@/server/rate-limit"
import { buildAssistantSystemPrompt } from "@/server/ai/assistant/prompt"
import {
  buildAssistantTools,
  type AssistantUIMessage,
} from "@/server/ai/assistant/tools"

export const maxDuration = 30

const MAX_HISTORY = 20
const MAX_STEPS = 6
const MAX_OUTPUT_TOKENS = 1000
/** Tamanho máximo do corpo (caracteres): limita o custo por requisição. */
const MAX_BODY_CHARS = 100_000
const ASSISTANT_ERROR = "Não foi possível gerar a resposta agora."

const bodySchema = z.object({
  companyId: z.string().uuid(),
  messages: z
    .array(
      z
        .object({
          id: z.string(),
          role: z.enum(["user", "assistant"]),
          parts: z.array(z.unknown()),
        })
        .passthrough(),
    )
    .min(1),
})

/** Texto puro: o `useChat` mostra o corpo da resposta como mensagem de erro. */
function fail(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

export async function POST(request: Request): Promise<Response> {
  const user = await getUser()
  if (!user) return fail(401, "Não autenticado.")

  const active = await getActiveMembership()
  if (!active) return fail(403, "Nenhuma empresa ativa.")

  const raw = await request.text().catch(() => "")
  if (raw.length > MAX_BODY_CHARS) return fail(413, "Mensagem muito longa.")

  let body: unknown = null
  try {
    body = JSON.parse(raw)
  } catch {
    body = null
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return fail(400, "Requisição inválida.")

  const { companyId } = parsed.data
  const messages = parsed.data.messages as unknown as AssistantUIMessage[]

  const company = await getCompany(active.tenantId, companyId)
  if (!company) return fail(404, "Cliente não encontrado.")

  if (!isAiConfigured()) return fail(503, "Assistente indisponível.")

  const rateLimit = await checkAiRateLimit(user.id)
  if (rateLimit === "unavailable") {
    return fail(503, "Assistente temporariamente indisponível.")
  }
  if (rateLimit === "limited") {
    return fail(429, "Muitas mensagens. Tente novamente em alguns minutos.")
  }

  const profile = await getProfile()
  const tools = buildAssistantTools({
    supabase: await createClient(),
    tenantId: active.tenantId,
    companyId,
  })

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(
      messages.slice(-MAX_HISTORY),
      // Um cartão de tarefa ignorado (o usuário seguiu conversando) deixa
      // uma chamada sem resultado no histórico; sem isto a conversa quebra.
      { tools, ignoreIncompleteToolCalls: true },
    )
  } catch (error) {
    logger.warn("ai.assistant_invalid_messages", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    })
    return fail(400, "Requisição inválida.")
  }

  const result = streamText({
    model: getChatModel(),
    system: buildAssistantSystemPrompt({
      companyName: company.name,
      userName: profile?.full_name ?? null,
      today: new Date().toISOString().slice(0, 10),
    }),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxRetries: 1,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      logger.error("ai.assistant_failed", {
        companyId,
        error: error instanceof Error ? error.message : String(error),
      })
      return ASSISTANT_ERROR
    },
  })
}
