import { describe, expect, it } from "vitest"
import { buildChecks, summarize, type SeoCheck } from "@/server/seo/audit"
import { isPrivateAddress, type FetchedPage } from "@/server/seo/fetch-page"

function page(overrides: Partial<FetchedPage> = {}): FetchedPage {
  const body = Array.from(
    { length: 350 },
    (_, index) => `palavra${index}`,
  ).join(" ")

  return {
    finalUrl: "https://example.com/",
    status: 200,
    headers: {
      "content-encoding": "gzip",
      "strict-transport-security": "max-age=31536000",
      "content-security-policy": "default-src 'self'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
    html: `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Orbit CRM: gestão de projetos e clientes</title>
          <meta name="description" content="Centralize clientes, projetos, tarefas, horas e financeiro em um único CRM para agências e consultorias." />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href="https://example.com/" />
          <link rel="icon" href="/favicon.ico" />
          <meta property="og:title" content="Orbit CRM" />
          <meta property="og:description" content="CRM para agências" />
          <meta property="og:image" content="https://example.com/og.png" />
          <script type="application/ld+json">{"@type":"WebSite","name":"Orbit"}</script>
        </head>
        <body>
          <h1>Orbit CRM</h1>
          <p>${body}</p>
          <a href="/sobre">Sobre</a>
          <a href="https://example.org" target="_blank" rel="noopener">Externo</a>
          <img src="/a.png" alt="Imagem A" />
          <img src="/b.png" alt="Imagem B" />
        </body>
      </html>`,
    responseTimeMs: 500,
    pageSizeBytes: 8_000,
    contentType: "text/html; charset=utf-8",
    ...overrides,
  }
}

function getCheck(checks: SeoCheck[], id: string) {
  const found = checks.find((check) => check.id === id)
  if (!found) throw new Error(`Check ${id} não encontrado`)
  return found
}

describe("SEO audit checks", () => {
  it("aprova uma página completa", () => {
    const checks = buildChecks(page())
    const summary = summarize(checks)

    expect(summary.score).toBe(100)
    expect(summary.issuesTotal).toBe(0)
    expect(getCheck(checks, "title").status).toBe("pass")
    expect(getCheck(checks, "meta_description").status).toBe("pass")
    expect(getCheck(checks, "h1").status).toBe("pass")
    expect(getCheck(checks, "schema").status).toBe("pass")
    expect(getCheck(checks, "security_headers").status).toBe("pass")
  })

  it("penaliza uma página incompleta", () => {
    const checks = buildChecks(
      page({
        finalUrl: "http://example.com/",
        status: 404,
        html: "<html><body><p>curto</p></body></html>",
        headers: {},
        pageSizeBytes: 500,
      }),
    )
    const summary = summarize(checks)

    expect(summary.score).toBeLessThan(50)
    expect(getCheck(checks, "status_code").status).toBe("fail")
    expect(getCheck(checks, "https").status).toBe("fail")
    expect(getCheck(checks, "title").status).toBe("fail")
    expect(getCheck(checks, "meta_description").status).toBe("fail")
    expect(getCheck(checks, "h1").status).toBe("fail")
    expect(getCheck(checks, "security_headers").status).toBe("fail")
  })

  it("calcula score com pesos por severidade", () => {
    const checks: SeoCheck[] = [
      {
        id: "a",
        category: "Conteúdo",
        label: "A",
        severity: "major",
        status: "pass",
        message: "",
      },
      {
        id: "b",
        category: "Técnico",
        label: "B",
        severity: "minor",
        status: "fail",
        message: "",
      },
    ]

    expect(summarize(checks).score).toBe(80)
  })
})

describe("SSRF guard", () => {
  it("bloqueia faixas privadas e reservadas", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true)
    expect(isPrivateAddress("10.0.0.1")).toBe(true)
    expect(isPrivateAddress("172.16.0.1")).toBe(true)
    expect(isPrivateAddress("192.168.1.1")).toBe(true)
    expect(isPrivateAddress("169.254.169.254")).toBe(true)
    expect(isPrivateAddress("::1")).toBe(true)
    expect(isPrivateAddress("fc00::1")).toBe(true)
    expect(isPrivateAddress("fe80::1")).toBe(true)
  })

  it("libera endereços públicos", () => {
    expect(isPrivateAddress("8.8.8.8")).toBe(false)
    expect(isPrivateAddress("1.1.1.1")).toBe(false)
    expect(isPrivateAddress("172.32.0.1")).toBe(false)
    expect(isPrivateAddress("2001:4860:4860::8888")).toBe(false)
  })
})
