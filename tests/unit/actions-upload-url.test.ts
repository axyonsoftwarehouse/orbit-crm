import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const PROJECT = "44444444-4444-4444-8444-444444444444"
const POST = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  quota: { ok: true } as { ok: boolean; message?: string },
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/server/plan-limits", () => ({
  checkStorageLimit: vi.fn(async () => state.quota),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { checkStorageLimit } from "@/server/plan-limits"
import { createUploadUrlAction } from "@/server/actions/storage"

function setup(
  tables: Record<string, { data: unknown; error: unknown }> = {},
  signed: { data: unknown; error: unknown } = {
    data: { token: "tok", path: "ignored" },
    error: null,
  },
) {
  const mock = createSupabaseMock(tables)
  const bucket = { createSignedUploadUrl: vi.fn(async () => signed) }
  const storage = { from: vi.fn(() => bucket) }
  Object.assign(mock.client, { storage })
  state.supabase = mock.client
  return { mock, bucket, storage }
}

const attachment = {
  kind: "attachment" as const,
  entityType: "project",
  entityId: PROJECT,
  fileName: "Briefing final (v2).pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
}

const image = {
  kind: "social_media" as const,
  postId: POST,
  fileName: "pão.png",
  mimeType: "image/png",
  sizeBytes: 4096,
}

describe("createUploadUrlAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    state.quota = { ok: true }
    vi.mocked(checkStorageLimit).mockClear()
  })

  it("sem empresa ativa, recusa", async () => {
    state.membership = null
    setup()
    await expect(createUploadUrlAction(attachment)).resolves.toEqual({
      error: "Nenhuma empresa ativa.",
    })
  })

  it("anexo: devolve URL assinada num caminho montado pelo servidor", async () => {
    const { mock, bucket, storage } = setup({
      projects: { data: { id: PROJECT }, error: null },
    })

    const result = await createUploadUrlAction(attachment)

    expect(storage.from).toHaveBeenCalledWith("attachments")
    expect(checkStorageLimit).toHaveBeenCalledWith(TENANT, 2048)
    expect(result).toMatchObject({ bucket: "attachments", token: "tok" })
    const { path } = result as { path: string }
    expect(path.startsWith(`${TENANT}/project/${PROJECT}/`)).toBe(true)
    expect(path.endsWith("-Briefing_final__v2_.pdf")).toBe(true)
    expect(bucket.createSignedUploadUrl).toHaveBeenCalledWith(path)
    const [calls] = mock.callsFor("projects")
    expect(hasCall(calls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(calls, "eq", "id", PROJECT)).toBe(true)
  })

  it("anexo: entidade de outro tenant ou inexistente é recusada", async () => {
    const { bucket } = setup({ projects: { data: null, error: null } })
    const result = await createUploadUrlAction(attachment)
    expect(result).toEqual({ error: "Registro não encontrado." })
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("anexo: tipo de entidade inválido é recusado", async () => {
    const { bucket } = setup()
    const result = await createUploadUrlAction({
      ...attachment,
      entityType: "invoice",
    })
    expect(result).toEqual({ error: "Entidade inválida." })
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("cota estourada não gera URL", async () => {
    state.quota = { ok: false, message: "Limite de armazenamento" }
    const { bucket } = setup({
      projects: { data: { id: PROJECT }, error: null },
    })
    await expect(createUploadUrlAction(attachment)).resolves.toEqual({
      error: "Limite de armazenamento",
    })
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("tamanho inválido é recusado", async () => {
    setup()
    await expect(
      createUploadUrlAction({ ...attachment, sizeBytes: -1 }),
    ).resolves.toEqual({ error: "Arquivo inválido." })
  })

  it("mídia do Social: caminho do post, só imagens até 10 MB", async () => {
    const { storage } = setup({
      social_posts: { data: { id: POST }, error: null },
    })
    const ok = await createUploadUrlAction(image)
    expect(storage.from).toHaveBeenCalledWith("social_media")
    const { path } = ok as { path: string }
    expect(path.startsWith(`${TENANT}/social/${POST}/`)).toBe(true)

    await expect(
      createUploadUrlAction({ ...image, mimeType: "application/pdf" }),
    ).resolves.toEqual({ error: "Envie apenas imagens." })
    await expect(
      createUploadUrlAction({ ...image, sizeBytes: 11 * 1024 * 1024 }),
    ).resolves.toEqual({ error: "A imagem deve ter no máximo 10 MB." })
  })

  it("mídia do Social: post de outro tenant é recusado", async () => {
    setup({ social_posts: { data: null, error: null } })
    await expect(createUploadUrlAction(image)).resolves.toEqual({
      error: "Post inválido.",
    })
  })

  it("falha do Storage vira mensagem genérica", async () => {
    setup(
      { projects: { data: { id: PROJECT }, error: null } },
      { data: null, error: { message: "new row violates row-level security" } },
    )
    await expect(createUploadUrlAction(attachment)).resolves.toEqual({
      error: "Não foi possível preparar o envio. Tente novamente.",
    })
  })
})
