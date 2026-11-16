import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const COMPANY = "33333333-3333-4333-8333-333333333333"
const PROJECT = "44444444-4444-4444-8444-444444444444"
const OTHER_USER = "55555555-5555-4555-8555-555555555555"

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
vi.mock("@/server/plan-limits", () => ({
  checkPlanLimit: async () => ({ ok: true }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { createAssistantTaskAction } from "@/server/actions/assistant"

function setup(overrides: { project?: unknown; member?: unknown } = {}) {
  const mock = createSupabaseMock({
    projects: {
      data: "project" in overrides ? overrides.project : { id: PROJECT },
      error: null,
    },
    memberships: {
      data: "member" in overrides ? overrides.member : { user_id: OTHER_USER },
      error: null,
    },
    tasks: { data: { id: "task-9" }, error: null },
  })
  state.supabase = mock.client
  return mock
}

const validInput = {
  company_id: COMPANY,
  project_id: PROJECT,
  name: "Enviar proposta revisada",
  due_date: "2026-11-20",
  priority: 3,
}

function insertedRow(mock: ReturnType<typeof setup>) {
  const insert = mock.callsFor("tasks")[0]?.find((c) => c.method === "insert")
  return insert?.args[0] as Record<string, unknown> | undefined
}

describe("createAssistantTaskAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
  })

  it("cria a tarefa quando o projeto é do cliente", async () => {
    const mock = setup()

    const result = await createAssistantTaskAction({
      ...validInput,
      assignee_id: OTHER_USER,
    })

    expect(result).toEqual({ ok: true, taskId: "task-9" })
    const projectQuery = mock.callsFor("projects")[0]!
    expect(hasCall(projectQuery, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(projectQuery, "eq", "company_id", COMPANY)).toBe(true)
    expect(insertedRow(mock)).toMatchObject({
      tenant_id: TENANT,
      created_by: USER,
      project_id: PROJECT,
      status: 1,
      assignee_id: OTHER_USER,
    })
  })

  it("sem assignee usa o próprio usuário", async () => {
    const mock = setup()

    await createAssistantTaskAction(validInput)

    expect(insertedRow(mock)).toMatchObject({ assignee_id: USER })
  })

  it("recusa projeto de outro cliente", async () => {
    const mock = setup({ project: null })

    const result = await createAssistantTaskAction(validInput)

    expect(result).toEqual({
      ok: false,
      error: "Projeto não encontrado para este cliente.",
    })
    expect(insertedRow(mock)).toBeUndefined()
  })

  it("recusa responsável que não é membro ativo", async () => {
    const mock = setup({ member: null })

    const result = await createAssistantTaskAction({
      ...validInput,
      assignee_id: OTHER_USER,
    })

    expect(result).toEqual({ ok: false, error: "Responsável inválido." })
    expect(insertedRow(mock)).toBeUndefined()
  })

  it("sem tenant ativo", async () => {
    state.membership = null
    setup()

    await expect(createAssistantTaskAction(validInput)).resolves.toEqual({
      ok: false,
      error: "Nenhuma empresa ativa.",
    })
  })

  it("input inválido", async () => {
    const mock = setup()

    const result = await createAssistantTaskAction({
      ...validInput,
      name: "",
    })

    expect(result.ok).toBe(false)
    expect(mock.client.from).not.toHaveBeenCalled()
  })
})
