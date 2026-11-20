import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from "ai"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { getProfile, getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { getChatModel, isAiConfigured } from "@/server/ai/model"
import { checkAiRateLimit } from "@/server/rate-limit"
import { todayIso } from "@/lib/format"

const MAX_HISTORY = 20
const MAX_STEPS = 6
const MAX_OUTPUT_TOKENS = 1000
/** Tamanho máximo do corpo (caracteres): limita o custo por requisição. */
const MAX_BODY_CHARS = 100_000
const ASSISTANT_ERROR = "Não foi possível gerar a resposta agora."

const messagesSchema = z
  .array(
    z
      .object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.unknown()),
      })
      .passthrough(),
  )
  .min(1)

export type AssistantSetup = { system: string; tools: ToolSet }

export type AssistantResolver = (input: {
  supabase: SupabaseClient<Database>
  tenantId: string
  entityId: string
  userName: string | null
  today: string
}) => Promise<AssistantSetup | null>

/** Texto puro: o `useChat` mostra o corpo da resposta como mensagem de erro. */
function fail(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

/**
 * Fluxo comum das rotas do assistente: autenticação, tenant ativo, tamanho e
 * formato do corpo, entidade do tenant (`resolve` devolve null → 404), chave
 * de IA, rate limit e streaming. `idField` é o campo do corpo com o ID.
 */
export async function handleAssistantRequest(
  request: Request,
  options: { idField: string; notFound: string; resolve: AssistantResolver },
): Promise<Response> {
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
  const parsed = z
    .object({ [options.idField]: z.string().uuid(), messages: messagesSchema })
    .safeParse(body)
  if (!parsed.success) return fail(400, "Requisição inválida.")

  const entityId = parsed.data[options.idField] as string
  const messages = parsed.data.messages as unknown as UIMessage[]
  const logContext = { [options.idField]: entityId }

  const supabase = await createClient()
  const profile = await getProfile()
  const setup = await options.resolve({
    supabase,
    tenantId: active.tenantId,
    entityId,
    userName: profile?.full_name ?? null,
    today: todayIso(),
  })
  if (!setup) return fail(404, options.notFound)

  if (!isAiConfigured()) return fail(503, "Assistente indisponível.")

  const rateLimit = await checkAiRateLimit(user.id)
  if (rateLimit === "unavailable") {
    return fail(503, "Assistente temporariamente indisponível.")
  }
  if (rateLimit === "limited") {
    return fail(429, "Muitas mensagens. Tente novamente em alguns minutos.")
  }

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(
      messages.slice(-MAX_HISTORY),
      // Um cartão ignorado (o usuário seguiu conversando) deixa uma chamada
      // sem resultado no histórico; sem isto a conversa quebra.
      { tools: setup.tools, ignoreIncompleteToolCalls: true },
    )
  } catch (error) {
    logger.warn("ai.assistant_invalid_messages", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    })
    return fail(400, "Requisição inválida.")
  }

  const result = streamText({
    model: getChatModel(),
    system: setup.system,
    messages: modelMessages,
    tools: setup.tools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxRetries: 1,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      logger.error("ai.assistant_failed", {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      })
      return ASSISTANT_ERROR
    },
  })
}
