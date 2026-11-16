import { convertToModelMessages, stepCountIs, streamText } from "ai"
import { z } from "zod"
import { getProfile, getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { getCompany } from "@/server/queries/companies"
import { getChatModel, isAiConfigured } from "@/server/ai/model"
import { isAiRateLimited } from "@/server/rate-limit"
import { buildAssistantSystemPrompt } from "@/server/ai/assistant/prompt"
import {
  buildAssistantTools,
  type AssistantUIMessage,
} from "@/server/ai/assistant/tools"

export const maxDuration = 30

const MAX_HISTORY = 20
const MAX_STEPS = 6
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

function json(status: number, error: string) {
  return Response.json({ error }, { status })
}

export async function POST(request: Request): Promise<Response> {
  const user = await getUser()
  if (!user) return json(401, "Não autenticado.")

  const active = await getActiveMembership()
  if (!active) return json(403, "Nenhuma empresa ativa.")

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json(400, "Requisição inválida.")

  const { companyId } = parsed.data
  const messages = parsed.data.messages as unknown as AssistantUIMessage[]

  const company = await getCompany(active.tenantId, companyId)
  if (!company) return json(404, "Cliente não encontrado.")

  if (!isAiConfigured()) return json(503, "Assistente indisponível.")

  if (await isAiRateLimited(user.id)) {
    return json(429, "Muitas mensagens. Tente novamente em alguns minutos.")
  }

  const profile = await getProfile()
  const tools = buildAssistantTools({
    supabase: await createClient(),
    tenantId: active.tenantId,
    companyId,
  })

  const result = streamText({
    model: getChatModel(),
    system: buildAssistantSystemPrompt({
      companyName: company.name,
      userName: profile?.full_name ?? null,
      today: new Date().toISOString().slice(0, 10),
    }),
    messages: await convertToModelMessages(messages.slice(-MAX_HISTORY), {
      tools,
    }),
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxRetries: 1,
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
