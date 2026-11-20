import { describe, expect, it } from "vitest"
import { UserFacingError, userMessage } from "@/lib/errors"
import { SeoFetchError } from "@/server/seo/fetch-page"
import { SeoAiError } from "@/server/seo/ai-summary"

describe("userMessage", () => {
  it("repassa a mensagem de erros feitos para o usuário", () => {
    expect(userMessage(new UserFacingError("Envie apenas imagens."), "x")).toBe(
      "Envie apenas imagens.",
    )
  })

  it("erros do SEO são mensagens para o usuário", () => {
    expect(
      userMessage(new SeoFetchError("Não foi possível acessar a URL."), "x"),
    ).toBe("Não foi possível acessar a URL.")
    expect(
      userMessage(
        new SeoAiError("O provedor de IA retornou um resumo vazio."),
        "x",
      ),
    ).toBe("O provedor de IA retornou um resumo vazio.")
  })

  it("qualquer outro erro vira a mensagem padrão", () => {
    const fallback = "Algo deu errado. Tente novamente."
    expect(userMessage(new Error("fetch failed"), fallback)).toBe(fallback)
    expect(
      userMessage(
        new TypeError("new row violates row-level security"),
        fallback,
      ),
    ).toBe(fallback)
    expect(userMessage("boom", fallback)).toBe(fallback)
    expect(userMessage(undefined, fallback)).toBe(fallback)
  })
})
