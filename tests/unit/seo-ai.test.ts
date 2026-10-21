import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SeoAuditResult } from "@/server/seo/audit"

const envState = vi.hoisted(() => ({
  apiKey: "test-key" as string | undefined,
}))

vi.mock("@/lib/env", () => ({
  env: () => ({
    OPENAI_API_KEY: envState.apiKey,
    OPENAI_MODEL: "gpt-test",
  }),
}))

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
    envState.apiKey = "test-key"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("gera o resumo via OpenAI", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Resumo gerado." } }],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(generateSeoAiSummary(result())).resolves.toBe("Resumo gerado.")
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"model":"gpt-test"'),
      }),
    )
  })

  it("falha quando a chave não está configurada", async () => {
    envState.apiKey = undefined

    await expect(generateSeoAiSummary(result())).rejects.toBeInstanceOf(
      SeoAiError,
    )
  })
})
