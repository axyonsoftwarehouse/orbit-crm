import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import type { LanguageModel } from "ai"
import { env } from "@/lib/env"

export class AiError extends Error {}

/**
 * Roteamento obrigatório no OpenRouter: só provedores que não retêm nem
 * treinam com os dados enviados (dados de clientes / LGPD). Toda chamada de
 * IA do app deve passar por `getChatModel()` para herdar esta configuração.
 */
export const PRIVACY_ROUTING = {
  data_collection: "deny",
  zdr: true,
} as const

export function isAiConfigured(): boolean {
  return Boolean(env().OPENROUTER_API_KEY)
}

export function getChatModel(): LanguageModel {
  const { OPENROUTER_API_KEY: apiKey, OPENROUTER_MODEL: model } = env()
  if (!apiKey) {
    throw new AiError("OPENROUTER_API_KEY não configurada.")
  }

  return createOpenRouter({ apiKey }).chat(model, {
    provider: PRIVACY_ROUTING,
  })
}
