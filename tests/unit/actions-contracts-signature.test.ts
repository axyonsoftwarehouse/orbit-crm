import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const state = vi.hoisted(() => ({
  client: null as unknown,
  role: "owner",
  sent: true as boolean,
  linkCalls: [] as unknown[],
  emails: [] as unknown[],
  removes: [] as string[],
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "u1" }),
}))
vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => ({ tenantId: "t1", role: state.role }),
}))
vi.mock("@/server/document-sharing/links", () => ({
  createDocumentLink: vi.fn(async (_client, input) => {
    state.linkCalls.push(input)
    return { token: "tok", id: "l1" }
  }),
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async (_client, input) => {
    state.emails.push(input)
    return { sent: state.sent }
  }),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("@/lib/env", () => ({
  env: () => ({ NEXT_PUBLIC_SITE_URL: "https://crm.test" }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  clearContractSignatureAction,
  markContractSignedAction,
  sendContractForSignatureAction,
} from "@/server/actions/contracts"

const contract = {
  id: "c1",
  tenant_id: "t1",
  company_id: "co1",
  title: "Contrato de serviço",
  value: 1000,
  start_date: "2026-01-01",
  end_date: null,
  signed_at: null,
  signature_path: null,
  deleted_at: null,
}

function setup(
  input: {
    contract?: Record<string, unknown> | null
    contacts?: unknown[]
    updateRows?: unknown[]
  } = {},
) {
  const mock = createSupabaseMock({
    contracts: (calls) =>
      calls.some((call) => call.method === "update")
        ? { data: input.updateRows ?? [{ id: "c1" }], error: null }
        : {
            data: input.contract === undefined ? contract : input.contract,
            error: null,
          },
    contacts: {
      data:
        input.contacts === undefined
          ? [{ id: "ct1", email: "ana@acme.com" }]
          : input.contacts,
      error: null,
    },
    tenants: { data: { name: "Orbit" }, error: null },
    contract_events: { data: null, error: null },
    document_links: { data: null, error: null },
  })
  state.client = Object.assign(mock.client, {
    storage: {
      from: () => ({
        remove: async (paths: string[]) => {
          state.removes.push(...paths)
          return { error: null }
        },
      }),
    },
  })
  return mock
}

describe("sendContractForSignatureAction", () => {
  beforeEach(() => {
    state.role = "owner"
    state.sent = true
    state.linkCalls = []
    state.emails = []
    state.removes = []
  })

  it("recusa contrato de outro tenant / inexistente", async () => {
    setup({ contract: null })
    await expect(
      sendContractForSignatureAction({ id: "c1", contactIds: ["ct1"] }),
    ).resolves.toEqual({ error: "Contrato não encontrado." })
  })

  it("recusa contrato já assinado", async () => {
    setup({ contract: { ...contract, signed_at: "2026-01-01T10:00:00Z" } })
    await expect(
      sendContractForSignatureAction({ id: "c1", contactIds: ["ct1"] }),
    ).resolves.toMatchObject({ error: expect.stringContaining("assinado") })
  })

  it("recusa contrato sem cliente", async () => {
    setup({ contract: { ...contract, company_id: null } })
    await expect(
      sendContractForSignatureAction({ id: "c1", contactIds: ["ct1"] }),
    ).resolves.toMatchObject({ error: expect.stringContaining("cliente") })
  })

  it("cria link de contrato, envia e grava o evento", async () => {
    const mock = setup()
    await expect(
      sendContractForSignatureAction({
        id: "c1",
        contactIds: ["ct1"],
        message: "Segue",
      }),
    ).resolves.toMatchObject({ sent: 1 })

    expect(state.linkCalls).toHaveLength(1)
    expect(state.linkCalls[0]).toMatchObject({
      tenantId: "t1",
      kind: "contract",
      docId: "c1",
    })
    expect(state.emails[0]).toMatchObject({
      templateKey: "contract_sent",
      to: "ana@acme.com",
    })
    const update = mock
      .callsFor("contracts")
      .find((calls) => calls.some((call) => call.method === "update"))!
    const payload = update.find((call) => call.method === "update")!
      .args[0] as Record<string, unknown>
    expect(payload.last_sent_at).toEqual(expect.any(String))

    const event = mock
      .callsFor("contract_events")
      .find((calls) => calls.some((call) => call.method === "insert"))!
    const eventPayload = event.find((call) => call.method === "insert")!
      .args[0] as Record<string, unknown>
    expect(eventPayload.kind).toBe("sent")
  })

  it("revoga o link quando nenhum e-mail sai", async () => {
    state.sent = false
    const mock = setup()
    await expect(
      sendContractForSignatureAction({ id: "c1", contactIds: ["ct1"] }),
    ).resolves.toMatchObject({ error: expect.any(String) })
    expect(state.linkCalls).toHaveLength(1)
    const linkUpdate = mock
      .callsFor("document_links")
      .find((calls) => calls.some((call) => call.method === "update"))
    expect(linkUpdate).toBeDefined()
    const payload = linkUpdate!.find((call) => call.method === "update")!
      .args[0] as Record<string, unknown>
    expect(payload.revoked_at).toEqual(expect.any(String))
  })
})

describe("clearContractSignatureAction", () => {
  beforeEach(() => {
    state.role = "owner"
    state.removes = []
  })

  it("exige papel admin/owner", async () => {
    state.role = "member"
    setup()
    await expect(clearContractSignatureAction("c1")).resolves.toEqual({
      error: "Sem permissão.",
    })
  })

  it("remove o PNG e limpa o aceite", async () => {
    const mock = setup({
      contract: {
        ...contract,
        signed_at: "2026-01-01T10:00:00Z",
        signature_path: "t1/contracts/c1/signature-x.png",
      },
    })
    await expect(clearContractSignatureAction("c1")).resolves.toEqual({
      ok: true,
    })

    expect(state.removes).toEqual(["t1/contracts/c1/signature-x.png"])
    const update = mock
      .callsFor("contracts")
      .find((calls) => calls.some((call) => call.method === "update"))!
    const payload = update.find((call) => call.method === "update")!
      .args[0] as Record<string, unknown>
    expect(payload.signed_at).toBeNull()
    expect(payload.content_hash).toBeNull()
    expect(payload.acceptance_ip).toBeNull()
  })
})

describe("markContractSignedAction", () => {
  beforeEach(() => {
    state.role = "owner"
  })

  it("marca o selo de papel sem tocar em signed_at", async () => {
    const mock = setup()
    await expect(markContractSignedAction("c1")).resolves.toEqual({ ok: true })

    const update = mock
      .callsFor("contracts")
      .find((calls) => calls.some((call) => call.method === "update"))!
    const payload = update.find((call) => call.method === "update")!
      .args[0] as Record<string, unknown>
    expect(payload.marked_as_signed_at).toEqual(expect.any(String))
    expect(payload.marked_as_signed_by).toBe("u1")
    expect(payload).not.toHaveProperty("signed_at")
  })
})
