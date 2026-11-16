import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockLanguageModelV4 } from "ai/test"
import type { SeoAuditResult } from "@/server/seo/audit"
import { textResult } from "./ai-test-utils"

const modelState = vi.hoisted(() => ({
  model: null as unknown,
  missingKey: false,
}))

vi.mock("@/server/ai/model", async () => {
  class AiError extends Error {}
  return {
    AiError,
    getChatModel: () => {
      if (modelState.missingKey) {
        throw new AiError("OPENROUTER_API_KEY não configurada.")
      }
      return modelState.model
    },
  }
})

import { generateSeoAiSummary, SeoAiError } from "@/server/seo/ai-summary"

function result(): SeoAuditResult {
  return {
    version: 1,
    url: "https://example.com",
    finalUrl: "https://example.com/",
    statusCode: 200,
    fetchedAt: new Date().toISOString(),
    responseTimeMs: 400,
    pageSizeBytes: 1000,
    checks: [
      {
        id: "title",
        category: "Conteúdo",
        label: "Título",
        severity: "major",
        status: "fail",
        message: "A página não possui título.",
      },
    ],
    summary: {
      score: 75,
      checksTotal: 1,
      passed: 0,
      warnings: 0,
      failed: 1,
      majorIssues: 1,
      moderateIssues: 0,
      minorIssues: 0,
      issuesTotal: 1,
    },
  }
}

describe("SEO AI summary", () => {
  beforeEach(() => {
    modelState.missingKey = false
    modelState.model = new MockLanguageModelV4({
      doGenerate: textResult("  Resumo gerado.  "),
    })
  })

  it("gera o resumo via OpenRouter", async () => {
    const model = modelState.model as MockLanguageModelV4

    await expect(generateSeoAiSummary(result())).resolves.toBe("Resumo gerado.")
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt)
    expect(prompt).toContain("Score: 75/100")
    expect(prompt).toContain("A página não possui título.")
  })

  it("sem chave lança SeoAiError com a mensagem de configuração", async () => {
    modelState.missingKey = true

    const error = await generateSeoAiSummary(result()).catch((e) => e)
    expect(error).toBeInstanceOf(SeoAiError)
    expect(error.message).toContain("OPENROUTER_API_KEY")
  })

  it("erro do provedor vira mensagem genérica", async () => {
    modelState.model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("upstream 500")
      },
    })

    await expect(generateSeoAiSummary(result())).rejects.toThrow(
      new SeoAiError("O provedor de IA não conseguiu gerar o resumo."),
    )
  })

  it("texto vazio vira erro", async () => {
    modelState.model = new MockLanguageModelV4({
      doGenerate: textResult("  "),
    })

    await expect(generateSeoAiSummary(result())).rejects.toThrow(
      new SeoAiError("O provedor de IA retornou um resumo vazio."),
    )
  })
})
