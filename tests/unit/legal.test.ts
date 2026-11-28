import { afterEach, describe, expect, it, vi } from "vitest"
import { LEGAL, LEGAL_PATHS, missingLegalFields } from "@/lib/legal"

describe("dados legais", () => {
  it("lista os campos que faltam preencher", () => {
    const missing = missingLegalFields()
    for (const field of missing) expect(LEGAL[field]).toBeFalsy()
  })

  it("rotas públicas fixas", () => {
    expect(LEGAL_PATHS).toEqual({ terms: "/termos", privacy: "/privacidade" })
  })
})

describe("rodapé dos e-mails", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("monta o link absoluto da política sem barra dupla", async () => {
    const { emailFooterHtml } = await import("@/lib/email")
    const html = emailFooterHtml("https://app.orbitcrm.app/")
    expect(html).toContain('href="https://app.orbitcrm.app/privacidade"')
    expect(html).toContain("Política de privacidade")
  })

  it("todo e-mail enviado leva o rodapé", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.orbitcrm.app")
    vi.stubEnv("RESEND_API_KEY", "re_test")
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { sendEmail } = await import("@/lib/email")
    await expect(
      sendEmail({ to: "a@b.test", subject: "Oi", html: "<p>Corpo</p>" }),
    ).resolves.toEqual({ sent: true })

    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][]
    const body = JSON.parse(String(calls[0]![1].body)) as { html: string }
    expect(body.html.startsWith("<p>Corpo</p>")).toBe(true)
    expect(body.html).toContain("https://app.orbitcrm.app/privacidade")
  })
})
