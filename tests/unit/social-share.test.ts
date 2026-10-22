import { describe, expect, it } from "vitest"
import { buildSocialShareLinks, extractFirstUrl } from "@/lib/social-share"

describe("social share links", () => {
  it("extrai a primeira URL", () => {
    expect(extractFirstUrl("Veja https://orbitcrm.app e depois outro")).toBe(
      "https://orbitcrm.app",
    )
    expect(extractFirstUrl("Sem link")).toBeNull()
  })

  it("gera links de texto mesmo sem URL", () => {
    const links = buildSocialShareLinks("Novo post")
    expect(links.map((link) => link.provider)).toEqual([
      "x",
      "bluesky",
      "whatsapp",
    ])
    expect(links[0].url).toBe(
      "https://twitter.com/intent/tweet?text=Novo%20post",
    )
  })

  it("gera links de link quando há URL", () => {
    const links = buildSocialShareLinks(
      "Confira https://orbitcrm.app/novidades",
    )
    expect(links.map((link) => link.provider)).toContain("telegram")
    expect(links.map((link) => link.provider)).toContain("facebook")
    expect(links.map((link) => link.provider)).toContain("linkedin")
  })
})
