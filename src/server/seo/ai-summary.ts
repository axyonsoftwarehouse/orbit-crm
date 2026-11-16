import { generateText } from "ai"
import { AiError, getChatModel } from "@/server/ai/model"
import type { SeoAuditResult } from "./audit"

export class SeoAiError extends Error {}

const SYSTEM_PROMPT =
  "Você é um consultor sênior de SEO técnico e de conteúdo. Responda em português do Brasil, com foco em ações práticas e priorizadas."

export async function generateSeoAiSummary(
  result: SeoAuditResult,
): Promise<string> {
  let model
  try {
    model = getChatModel()
  } catch (error) {
    if (error instanceof AiError) {
      throw new SeoAiError(
        "OPENROUTER_API_KEY não configurada. Configure a chave para gerar o resumo.",
      )
    }
    throw error
  }

  const issues = result.checks
    .filter((check) => check.status !== "pass")
    .map(
      (check) =>
        `- [${check.severity}/${check.status}] ${check.label}: ${check.message}`,
    )
    .join("\n")

  const prompt = [
    `Site auditado: ${result.finalUrl}`,
    `Score: ${result.summary.score}/100`,
    `Verificações: ${result.summary.checksTotal} (${result.summary.passed} aprovadas, ${result.summary.warnings} avisos, ${result.summary.failed} falhas)`,
    "",
    "Problemas encontrados:",
    issues || "Nenhum problema encontrado.",
    "",
    "Escreva um resumo em português do Brasil, em 3 parágrafos curtos:",
    "1) diagnóstico geral do estado do site;",
    "2) as prioridades de correção, citando os problemas mais graves;",
    "3) próximos passos práticos.",
    "Não invente dados que não estão no relatório. Seja direto e técnico, sem saudação.",
  ].join("\n")

  let text: string
  try {
    const response = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 450,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(8_000),
    })
    text = response.text
  } catch {
    throw new SeoAiError("O provedor de IA não conseguiu gerar o resumo.")
  }

  const summary = text.trim()
  if (!summary) {
    throw new SeoAiError("O provedor de IA retornou um resumo vazio.")
  }

  return summary
}
