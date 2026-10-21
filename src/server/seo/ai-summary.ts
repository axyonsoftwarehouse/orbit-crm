import { env } from "@/lib/env"
import type { SeoAuditResult } from "./audit"

export class SeoAiError extends Error {}

export async function generateSeoAiSummary(
  result: SeoAuditResult,
): Promise<string> {
  const { OPENAI_API_KEY: apiKey, OPENAI_MODEL: model } = env()
  if (!apiKey) {
    throw new SeoAiError(
      "OPENAI_API_KEY não configurada. Configure a chave para gerar o resumo.",
    )
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

  let response: Response
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              "Você é um consultor sênior de SEO técnico e de conteúdo. Responda em português do Brasil, com foco em ações práticas e priorizadas.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw new SeoAiError("Não foi possível conectar ao provedor de IA.")
  }

  if (!response.ok) {
    throw new SeoAiError("O provedor de IA não conseguiu gerar o resumo.")
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const summary = data.choices?.[0]?.message?.content?.trim()
  if (!summary) {
    throw new SeoAiError("O provedor de IA retornou um resumo vazio.")
  }

  return summary
}
