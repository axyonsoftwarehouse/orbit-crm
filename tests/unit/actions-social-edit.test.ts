import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const POST = "33333333-3333-4333-8333-333333333333"
const COMPANY = "44444444-4444-4444-8444-444444444444"
const ACCOUNT_A = "55555555-5555-4555-8555-555555555555"
const ACCOUNT_B = "66666666-6666-4666-8666-666666666666"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/server/queries/portal", () => ({ getPortalContact: vi.fn() }))
vi.mock("@/server/storage-quota", () => ({
  verifyUploadedFile: async () => ({ size: 1234 }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/server/social/approval-notifications", () => ({
  notifyPortalApprovalRequested: vi.fn(),
  notifyStaffPortalResponse: vi.fn(),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  deleteSocialMediaAction,
  registerSocialMediaAction,
  updateSocialPostAction,
} from "@/server/actions/social"

type Post = { status: string; requires_approval: boolean }

function setup(post: Post | null, options: { updated?: unknown[] } = {}) {
  const remove = vi.fn(async () => ({ data: null, error: null }))
  const mock = createSupabaseMock({
    social_posts: (calls) =>
      calls.some((call) => call.method === "update")
        ? { data: options.updated ?? [{ id: POST }], error: null }
        : {
            data: post ? { id: POST, company_id: COMPANY, ...post } : null,
            error: null,
          },
    social_accounts: {
      data: [
        { id: ACCOUNT_A, company_id: COMPANY },
        { id: ACCOUNT_B, company_id: null },
      ],
      error: null,
    },
    social_media: (calls) =>
      calls.some((call) => call.method === "select")
        ? {
            data: {
              storage_path: `${TENANT}/social/${POST}/a.png`,
              created_by: USER,
              post_id: POST,
            },
            error: null,
          }
        : { data: null, error: null },
  })
  Object.assign(mock.client, {
    storage: { from: () => ({ remove }) },
  })
  state.supabase = mock.client
  return { mock, remove }
}

function editForm(targets = [ACCOUNT_A, ACCOUNT_B]) {
  const data = new FormData()
  data.set("id", POST)
  data.set("content", "Texto ajustado")
  for (const id of targets) data.append("target_ids", id)
  return data
}

function postUpdate(mock: ReturnType<typeof createSupabaseMock>) {
  return mock
    .callsFor("social_posts")
    .find((calls) => calls.some((call) => call.method === "update"))!
}

function events(mock: ReturnType<typeof createSupabaseMock>) {
  return mock
    .callsFor("social_post_events")
    .map((calls) => calls.find((call) => call.method === "insert"))
    .map((call) => (call?.args[0] as { event: string }).event)
}

describe("updateSocialPostAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
  })

  it("edita o rejeitado, troca os destinos e mantém o status", async () => {
    const { mock } = setup({ status: "rejected", requires_approval: true })

    const result = await updateSocialPostAction(undefined, editForm())

    expect(result).toEqual({ success: "Post salvo." })
    const update = postUpdate(mock)
    expect(hasCall(update, "update", { content: "Texto ajustado" })).toBe(true)
    expect(hasCall(update, "eq", "status", "rejected")).toBe(true)
    expect(hasCall(update, "eq", "tenant_id", TENANT)).toBe(true)

    const [remove, insert] = mock.callsFor("social_post_targets")
    expect(hasCall(remove!, "delete")).toBe(true)
    expect(hasCall(remove!, "eq", "post_id", POST)).toBe(true)
    expect(insert).toContainEqual({
      method: "insert",
      args: [
        [
          { tenant_id: TENANT, post_id: POST, account_id: ACCOUNT_A },
          { tenant_id: TENANT, post_id: POST, account_id: ACCOUNT_B },
        ],
      ],
    })
    expect(events(mock)).toEqual(["edited"])
  })

  it("agendado que exige aprovação volta para rascunho e perde a agenda", async () => {
    const { mock } = setup({ status: "scheduled", requires_approval: true })

    const result = await updateSocialPostAction(undefined, editForm())

    expect(result?.success).toMatch(/voltou para rascunho/)
    expect(
      hasCall(postUpdate(mock), "update", {
        content: "Texto ajustado",
        status: "draft",
        scheduled_at: null,
        approved_by: null,
        approved_at: null,
      }),
    ).toBe(true)
    expect(events(mock)).toEqual(["edited", "approval_reset"])
  })

  it("agendado sem aprovação exigida continua agendado", async () => {
    const { mock } = setup({ status: "scheduled", requires_approval: false })

    await updateSocialPostAction(undefined, editForm())

    expect(
      hasCall(postUpdate(mock), "update", { content: "Texto ajustado" }),
    ).toBe(true)
    expect(events(mock)).toEqual(["edited"])
  })

  it("não edita enquanto o cliente avalia", async () => {
    const { mock } = setup({
      status: "pending_approval",
      requires_approval: true,
    })

    const result = await updateSocialPostAction(undefined, editForm())

    expect(result?.error).toMatch(/com o cliente para aprovação/)
    expect(mock.callsFor("social_post_targets")).toHaveLength(0)
  })

  it("recusa conta que não é do tenant", async () => {
    const other = "77777777-7777-4777-8777-777777777777"
    const { mock } = setup({ status: "draft", requires_approval: true })
    // A conta "other" não volta da consulta de contas do tenant.
    const result = await updateSocialPostAction(undefined, editForm([other]))

    expect(result?.error).toBe("Selecione contas válidas da empresa.")
    expect(mock.callsFor("social_post_targets")).toHaveLength(0)
  })

  it("post que mudou de status no meio do caminho não troca os destinos", async () => {
    const { mock } = setup(
      { status: "draft", requires_approval: true },
      { updated: [] },
    )

    const result = await updateSocialPostAction(undefined, editForm())

    expect(result?.error).toMatch(/mudou enquanto você editava/)
    expect(mock.callsFor("social_post_targets")).toHaveLength(0)
  })

  it("post de outro tenant não é encontrado", async () => {
    setup(null)
    const result = await updateSocialPostAction(undefined, editForm())
    expect(result).toEqual({ error: "Post não encontrado." })
  })
})

describe("mídia do post", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "admin" }
  })

  const upload = {
    postId: POST,
    storagePath: `${TENANT}/social/${POST}/nova.png`,
    fileName: "nova.png",
    mimeType: "image/png",
    sizeBytes: 1234,
  }

  it("nova imagem em post aprovado que exige aprovação volta para rascunho", async () => {
    const { mock } = setup({ status: "approved", requires_approval: true })

    await expect(registerSocialMediaAction(upload)).resolves.toEqual({})

    const reset = postUpdate(mock)
    expect(hasCall(reset, "eq", "requires_approval", true)).toBe(true)
    expect(hasCall(reset, "in", "status", ["approved", "scheduled"])).toBe(true)
    expect(events(mock)).toEqual(["approval_reset"])
  })

  it("não aceita imagem enquanto o cliente avalia e apaga o arquivo", async () => {
    const { mock, remove } = setup({
      status: "pending_approval",
      requires_approval: true,
    })

    const result = await registerSocialMediaAction(upload)

    expect(result.error).toMatch(/não pode mais ser alterada/)
    expect(remove).toHaveBeenCalledWith([upload.storagePath])
    expect(mock.callsFor("social_media")).toHaveLength(0)
  })

  it("remover imagem de post publicado não faz nada", async () => {
    const { mock, remove } = setup({
      status: "published",
      requires_approval: true,
    })
    const data = new FormData()
    data.set("id", "88888888-8888-4888-8888-888888888888")
    data.set("post_id", POST)

    await deleteSocialMediaAction(data)

    expect(remove).not.toHaveBeenCalled()
    expect(
      mock
        .callsFor("social_media")
        .some((calls) => calls.some((call) => call.method === "delete")),
    ).toBe(false)
  })

  it("remover imagem de rascunho apaga sem mexer no status", async () => {
    // Rascunho não casa com o filtro de aprovado/agendado: nada é desfeito.
    const { mock, remove } = setup(
      { status: "draft", requires_approval: true },
      { updated: [] },
    )
    const data = new FormData()
    data.set("id", "88888888-8888-4888-8888-888888888888")
    data.set("post_id", POST)

    await deleteSocialMediaAction(data)

    expect(remove).toHaveBeenCalled()
    expect(events(mock)).toEqual([])
  })
})
