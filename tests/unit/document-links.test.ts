import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { createSupabaseMock, hasCall } from "./supabase-mock"
import {
  generateLinkToken,
  hashLinkToken,
  linkExpiry,
  resolveDocumentLink,
} from "@/server/document-sharing/links"

describe("tokens de link", () => {
  it("token base64url de 32 bytes e hash sha256", () => {
    const { token, hash } = generateLinkToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toBe(createHash("sha256").update(token).digest("hex"))
    expect(hashLinkToken(token)).toBe(hash)
    expect(generateLinkToken().token).not.toBe(token)
  })
})

describe("linkExpiry", () => {
  const now = new Date("2026-11-20T12:00:00Z")

  it("orçamento vale até o fim do dia da validade em São Paulo", () => {
    expect(linkExpiry("estimate", "2026-12-19", now)).toBe(
      "2026-12-20T02:59:59.999Z",
    )
  })

  it("orçamento sem validade: 30 dias; fatura: 90 dias", () => {
    expect(linkExpiry("estimate", null, now)).toBe("2026-12-20T12:00:00.000Z")
    expect(linkExpiry("invoice", "2026-12-01", now)).toBe(
      "2027-02-18T12:00:00.000Z",
    )
  })
})

describe("resolveDocumentLink", () => {
  const now = new Date("2026-11-20T12:00:00Z")
  const row = {
    id: "l1",
    tenant_id: "t1",
    rel_type: "estimate",
    rel_id: "e1",
    expires_at: "2026-12-01T00:00:00Z",
    revoked_at: null,
  }

  it("encontra pelo hash do token", async () => {
    const mock = createSupabaseMock({
      document_links: { data: row, error: null },
    })
    const link = await resolveDocumentLink(mock.client as never, "abc", now)
    expect(link?.rel_id).toBe("e1")
    const [calls] = mock.callsFor("document_links")
    expect(hasCall(calls, "eq", "token_hash", hashLinkToken("abc"))).toBe(true)
  })

  it("expirado, revogado ou inexistente devolvem null", async () => {
    for (const data of [
      { ...row, expires_at: "2026-11-19T00:00:00Z" },
      { ...row, revoked_at: "2026-11-19T00:00:00Z" },
      null,
    ]) {
      const mock = createSupabaseMock({ document_links: { data, error: null } })
      expect(
        await resolveDocumentLink(mock.client as never, "abc", now),
      ).toBeNull()
    }
  })

  it("token vazio nem consulta", async () => {
    const mock = createSupabaseMock()
    expect(await resolveDocumentLink(mock.client as never, "", now)).toBeNull()
    expect(mock.callsFor("document_links")).toHaveLength(0)
  })
})
