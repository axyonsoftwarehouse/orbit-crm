import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const PROJECT = "44444444-4444-4444-8444-444444444444"
const POST = "33333333-3333-4333-8333-333333333333"
const LIMIT_MESSAGE =
  "Limite do plano atingido para este recurso. Faça upgrade para continuar."
const STORAGE_MESSAGE =
  "Limite de armazenamento do plano atingido. Faça upgrade para continuar."

const state = vi.hoisted(() => ({
  supabase: null as unknown,
  limit: { ok: true } as { ok: boolean; message?: string },
  storage: { ok: true } as { ok: boolean; message?: string },
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => ({ tenantId: TENANT, role: "admin" }),
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/server/plan-limits", () => ({
  checkPlanLimit: vi.fn(async () => state.limit),
  checkStorageLimit: vi.fn(async () => state.storage),
}))
vi.mock("@/server/queries/portal", () => ({
  getPortalContact: async () => null,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { checkPlanLimit, checkStorageLimit } from "@/server/plan-limits"
import {
  createTagAction,
  createTagForEntityAction,
} from "@/server/actions/tags"
import { createCustomFieldAction } from "@/server/actions/custom-fields"
import { createMilestoneAction } from "@/server/actions/milestones"
import { registerAttachmentAction } from "@/server/actions/attachments"
import { registerSocialMediaAction } from "@/server/actions/social"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function inserted(mock: ReturnType<typeof createSupabaseMock>, table: string) {
  return mock
    .callsFor(table)
    .some((calls) => calls.some((call) => call.method === "insert"))
}

function withStorage(
  mock: ReturnType<typeof createSupabaseMock>,
  info: { data: { size?: number } | null; error: unknown },
) {
  const bucket = {
    info: vi.fn(async () => info),
    remove: vi.fn(async () => ({ data: null, error: null })),
  }
  const storage = { from: vi.fn(() => bucket) }
  Object.assign(mock.client, { storage })
  return { bucket, storage }
}

describe("limites de plano nas actions de criação", () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    state.limit = { ok: false, message: LIMIT_MESSAGE }
    mock = createSupabaseMock()
    state.supabase = mock.client
    vi.mocked(checkPlanLimit).mockClear()
  })

  it("createTagAction barra no limite de tags", async () => {
    const result = await createTagAction(undefined, form({ name: "VIP" }))
    expect(result).toEqual({ error: LIMIT_MESSAGE })
    expect(checkPlanLimit).toHaveBeenCalledWith(TENANT, "tags")
    expect(inserted(mock, "tags")).toBe(false)
  })

  it("createTagForEntityAction também barra", async () => {
    const result = await createTagForEntityAction(
      undefined,
      form({ name: "VIP", entity_type: "project", entity_id: PROJECT }),
    )
    expect(result).toEqual({ error: LIMIT_MESSAGE })
    expect(inserted(mock, "tags")).toBe(false)
  })

  it("createCustomFieldAction barra no limite de campos", async () => {
    const result = await createCustomFieldAction(
      undefined,
      form({
        entity_type: "project",
        label: "Código",
        key: "codigo",
        field_type: "text",
      }),
    )
    expect(result).toEqual({ error: LIMIT_MESSAGE })
    expect(checkPlanLimit).toHaveBeenCalledWith(TENANT, "custom_fields")
    expect(inserted(mock, "custom_field_definitions")).toBe(false)
  })

  it("createMilestoneAction barra no limite de marcos", async () => {
    const result = await createMilestoneAction(
      undefined,
      form({ project_id: PROJECT, name: "Entrega 1" }),
    )
    expect(result).toEqual({ error: LIMIT_MESSAGE })
    expect(checkPlanLimit).toHaveBeenCalledWith(TENANT, "milestones")
    expect(inserted(mock, "milestones")).toBe(false)
  })
})

describe("cota de armazenamento no registro de arquivos", () => {
  const attachment = {
    entityType: "project",
    entityId: PROJECT,
    storagePath: `${TENANT}/project/${PROJECT}/a.pdf`,
    fileName: "a.pdf",
    mimeType: "application/pdf",
    sizeBytes: 10,
  }

  beforeEach(() => {
    state.storage = { ok: true }
    vi.mocked(checkStorageLimit).mockClear()
  })

  it("anexo: usa o tamanho real do objeto e grava esse valor", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client
    const { storage } = withStorage(mock, {
      data: { size: 5000 },
      error: null,
    })

    await expect(registerAttachmentAction(attachment)).resolves.toEqual({})
    expect(storage.from).toHaveBeenCalledWith("attachments")
    expect(checkStorageLimit).toHaveBeenCalledWith(TENANT, 5000)
    const insert = mock
      .callsFor("attachments")
      .flat()
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({ size_bytes: 5000 })
  })

  it("anexo: estourou a cota, remove o objeto e não registra", async () => {
    state.storage = { ok: false, message: STORAGE_MESSAGE }
    const mock = createSupabaseMock()
    state.supabase = mock.client
    const { bucket } = withStorage(mock, { data: { size: 5000 }, error: null })

    await expect(registerAttachmentAction(attachment)).resolves.toEqual({
      error: STORAGE_MESSAGE,
    })
    expect(bucket.remove).toHaveBeenCalledWith([attachment.storagePath])
    expect(inserted(mock, "attachments")).toBe(false)
  })

  it("anexo: caminho já registrado não é removido nem registrado de novo", async () => {
    state.storage = { ok: false, message: STORAGE_MESSAGE }
    const mock = createSupabaseMock({
      attachments: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: null, error: null }
          : { data: { id: "existente" }, error: null },
    })
    state.supabase = mock.client
    const { bucket } = withStorage(mock, { data: { size: 5000 }, error: null })

    const result = await registerAttachmentAction(attachment)
    expect(result.error).toBeTruthy()
    expect(bucket.remove).not.toHaveBeenCalled()
    expect(bucket.info).not.toHaveBeenCalled()
    expect(inserted(mock, "attachments")).toBe(false)
  })

  it("anexo: sem conseguir ler o objeto, não registra", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client
    withStorage(mock, { data: null, error: { message: "not found" } })

    const result = await registerAttachmentAction(attachment)
    expect(result.error).toBeTruthy()
    expect(inserted(mock, "attachments")).toBe(false)
  })

  it("mídia do Social: estourou a cota, remove o objeto e não registra", async () => {
    state.storage = { ok: false, message: STORAGE_MESSAGE }
    const mock = createSupabaseMock({
      social_posts: { data: { id: POST }, error: null },
    })
    state.supabase = mock.client
    const { bucket, storage } = withStorage(mock, {
      data: { size: 7000 },
      error: null,
    })
    const path = `${TENANT}/social/${POST}/img.png`

    await expect(
      registerSocialMediaAction({
        postId: POST,
        storagePath: path,
        fileName: "img.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
    ).resolves.toEqual({ error: STORAGE_MESSAGE })
    expect(storage.from).toHaveBeenCalledWith("social_media")
    expect(checkStorageLimit).toHaveBeenCalledWith(TENANT, 7000)
    expect(bucket.remove).toHaveBeenCalledWith([path])
    expect(inserted(mock, "social_media")).toBe(false)
  })

  it("mídia do Social: grava o tamanho real quando cabe", async () => {
    const mock = createSupabaseMock({
      social_posts: { data: { id: POST }, error: null },
    })
    state.supabase = mock.client
    withStorage(mock, { data: { size: 7000 }, error: null })

    await expect(
      registerSocialMediaAction({
        postId: POST,
        storagePath: `${TENANT}/social/${POST}/img.png`,
        fileName: "img.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
    ).resolves.toEqual({})
    const insert = mock
      .callsFor("social_media")
      .flat()
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({ size_bytes: 7000 })
  })
})
