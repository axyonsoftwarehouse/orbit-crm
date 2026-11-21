import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const PNG = `data:image/png;base64,${Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]).toString("base64")}`

const state = vi.hoisted(() => ({
  admin: null as unknown,
  link: null as unknown,
  limited: false,
  uploads: [] as { bucket: string; path: string }[],
  removes: [] as { bucket: string; path: string }[],
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/server/document-sharing/links", () => ({
  resolveDocumentLink: vi.fn(async () => state.link),
}))
vi.mock("@/server/rate-limit", () => ({
  getClientIp: async () => "1.2.3.4",
  isRateLimited: vi.fn(async () => state.limited),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { isRateLimited } from "@/server/rate-limit"
import { signContractAction } from "@/server/actions/contract-signature"

const link = {
  id: "l1",
  tenant_id: "t1",
  rel_type: "contract",
  rel_id: "c1",
  expires_at: "2099-01-01T00:00:00Z",
}

const contract = {
  id: "c1",
  tenant_id: "t1",
  company_id: "co1",
  title: "Contrato",
  content: "Oi {{cliente.nome}}",
  content_rendered: null,
  value: 100,
  start_date: "2026-01-01",
  end_date: null,
  signed_at: null,
  deleted_at: null,
}

function adminMock(overrides: Record<string, unknown> = {}) {
  const mock = createSupabaseMock({
    contracts: (calls) =>
      calls.some((call) => call.method === "update")
        ? { data: [{ id: "c1" }], error: null }
        : { data: contract, error: null },
    tenants: { data: { name: "Orbit", e_sign_legal_text: null }, error: null },
    companies: { data: { name: "ACME", vat: "123" }, error: null },
    contract_signers: { data: null, error: null },
    contract_events: { data: null, error: null },
    document_links: { data: null, error: null },
    ...overrides,
  })
  state.admin = Object.assign(mock.client, {
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string) => {
          state.uploads.push({ bucket, path })
          return { error: null }
        },
        remove: async (paths: string[]) => {
          for (const path of paths) state.removes.push({ bucket, path })
          return { error: null }
        },
      }),
    },
  })
  return mock
}

const input = {
  token: "tok",
  firstname: "Ana",
  lastname: "Souza",
  email: "ana@acme.com",
  signature: PNG,
  consent: true as const,
}

describe("signContractAction", () => {
  beforeEach(() => {
    state.link = link
    state.limited = false
    state.uploads = []
    state.removes = []
    vi.mocked(isRateLimited).mockClear()
  })

  it("aplica limite por IP antes de tudo", async () => {
    state.limited = true
    const mock = adminMock()
    await expect(signContractAction(input)).resolves.toEqual({
      error: "Muitas tentativas. Tente novamente em instantes.",
    })
    expect(isRateLimited).toHaveBeenCalledWith("contract:sign:1.2.3.4", 20, 600)
    expect(mock.callsFor("contracts")).toHaveLength(0)
  })

  it("recusa token de outro tipo de documento", async () => {
    state.link = { ...link, rel_type: "invoice" }
    adminMock()
    await expect(signContractAction(input)).resolves.toEqual({
      error: "Link inválido ou expirado.",
    })
  })

  it("recusa token inexistente", async () => {
    state.link = null
    adminMock()
    await expect(signContractAction(input)).resolves.toEqual({
      error: "Link inválido ou expirado.",
    })
  })

  it("contrato já assinado devolve sucesso sem regravar", async () => {
    state.link = { ...link, rel_id: "c2" }
    const mock = createSupabaseMock({
      contracts: {
        data: { ...contract, id: "c2", signed_at: "2026-01-01T00:00:00Z" },
        error: null,
      },
    })
    state.admin = mock.client
    await expect(signContractAction(input)).resolves.toEqual({ ok: true })
    expect(state.uploads).toHaveLength(0)
    const updated = mock
      .callsFor("contracts")
      .some((calls) => calls.some((call) => call.method === "update"))
    expect(updated).toBe(false)
  })

  it("assinatura inválida não sobe para o storage", async () => {
    adminMock()
    await expect(
      signContractAction({ ...input, signature: "data:image/png;base64,@@@" }),
    ).resolves.toEqual({ error: "Assinatura inválida." })
    expect(state.uploads).toHaveLength(0)
  })

  it("assinatura fora do formato PNG é recusada", async () => {
    adminMock()
    await expect(
      signContractAction({ ...input, signature: "data:image/jpeg;base64,AAAA" }),
    ).resolves.toEqual({ error: "Formato de assinatura inválido." })
  })

  it("grava aceite, hash, evento e marca o link como respondido", async () => {
    const mock = adminMock()
    await expect(signContractAction(input)).resolves.toEqual({ ok: true })

    expect(state.uploads).toHaveLength(1)
    expect(state.uploads[0].bucket).toBe("contracts")
    expect(state.uploads[0].path).toMatch(/^t1\/contracts\/c1\/signature-[\w-]+\.png$/)

    const update = mock
      .callsFor("contracts")
      .find((calls) => calls.some((call) => call.method === "update"))!
    expect(hasCall(update, "eq", "signed_at", null)).toBe(false)
    expect(hasCall(update, "is", "signed_at", null)).toBe(true)
    const payload = update.find((call) => call.method === "update")!.args[0] as Record<string, unknown>
    expect(payload.acceptance_firstname).toBe("Ana")
    expect(payload.acceptance_email).toBe("ana@acme.com")
    expect(payload.acceptance_ip).toBe("1.2.3.4")
    expect(payload.signed_at).toEqual(expect.any(String))
    expect(String(payload.content_rendered)).toBe("Oi ACME")
    expect(String(payload.content_hash)).toMatch(/^[a-f0-9]{64}$/)
    expect(String(payload.signature_path)).toMatch(/^t1\/contracts\/c1\//)

    const event = mock
      .callsFor("contract_events")
      .find((calls) => calls.some((call) => call.method === "insert"))!
    const eventPayload = event.find((call) => call.method === "insert")!.args[0] as Record<string, unknown>
    expect(eventPayload.kind).toBe("signed")
    expect(eventPayload.actor_kind).toBe("client")

    expect(mock.callsFor("document_links").length).toBeGreaterThan(0)
  })
})
