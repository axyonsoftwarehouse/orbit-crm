import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const OTHER = "55555555-5555-4555-8555-555555555555"

const state = vi.hoisted(() => ({
  membership: null as {
    tenantId: string
    role: string
    tenant: { name: string }
  } | null,
  supabase: null as unknown,
  admin: null as unknown,
  emailSent: true,
  ownerCount: 2,
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
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async () => ({ sent: state.emailSent })),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { sendTenantEmail } from "@/server/email"
import { inviteMemberAction, removeMemberAction } from "@/server/actions/team"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function as(role: string) {
  state.membership = { tenantId: TENANT, role, tenant: { name: "Orbit" } }
}

describe("inviteMemberAction", () => {
  beforeEach(() => {
    as("admin")
    state.emailSent = true
    process.env.NEXT_PUBLIC_SITE_URL = "https://crm.test"
    vi.mocked(sendTenantEmail).mockClear()
  })

  function setup(
    options: {
      profile?: unknown
      membership?: unknown
      pending?: unknown
    } = {},
  ) {
    const admin = createSupabaseMock({
      profiles: { data: options.profile ?? null, error: null },
    })
    const mock = createSupabaseMock({
      memberships: { data: options.membership ?? null, error: null },
      invitations: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: { token: "tok-123" }, error: null }
          : { data: options.pending ?? null, error: null },
    })
    state.admin = admin.client
    state.supabase = mock.client
    return mock
  }

  it("member não pode convidar", async () => {
    as("member")
    const mock = setup()

    const result = await inviteMemberAction(
      undefined,
      form({ email: "novo@acme.test", role: "member" }),
    )

    expect(result).toEqual({
      error: "Você não tem permissão para convidar membros.",
    })
    expect(mock.client.from).not.toHaveBeenCalled()
  })

  it("cria o convite no tenant ativo e envia o link por e-mail", async () => {
    const mock = setup()

    const result = await inviteMemberAction(
      undefined,
      form({ email: "novo@acme.test", role: "member" }),
    )

    expect(result).toEqual({
      success: "Convite enviado por e-mail.",
      inviteLink: "https://crm.test/convite/tok-123",
    })
    const insert = mock
      .callsFor("invitations")
      .flat()
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({
      tenant_id: TENANT,
      email: "novo@acme.test",
      role: "member",
    })
    expect(sendTenantEmail).toHaveBeenCalledWith(
      mock.client,
      expect.objectContaining({
        tenantId: TENANT,
        templateKey: "member_invite",
        to: "novo@acme.test",
      }),
    )
  })

  it("sem e-mail configurado devolve o link para copiar", async () => {
    state.emailSent = false
    setup()

    const result = await inviteMemberAction(
      undefined,
      form({ email: "novo@acme.test", role: "member" }),
    )

    expect(result?.success).toBe(
      "Convite criado. Copie o link abaixo e envie ao convidado.",
    )
  })

  it("recusa quem já é membro", async () => {
    const mock = setup({
      profile: { id: OTHER },
      membership: { user_id: OTHER },
    })

    const result = await inviteMemberAction(
      undefined,
      form({ email: "membro@acme.test", role: "member" }),
    )

    expect(result).toEqual({ error: "Esse e-mail já é membro da empresa." })
    const membershipQuery = mock.callsFor("memberships")[0]!
    expect(hasCall(membershipQuery, "eq", "tenant_id", TENANT)).toBe(true)
  })

  it("recusa convite pendente duplicado", async () => {
    const mock = setup({ pending: { id: "inv-old" } })

    const result = await inviteMemberAction(
      undefined,
      form({ email: "novo@acme.test", role: "member" }),
    )

    expect(result).toEqual({
      error: "Já existe um convite pendente para este e-mail.",
    })
    const inserts = mock
      .callsFor("invitations")
      .flat()
      .filter((call) => call.method === "insert")
    expect(inserts).toEqual([])
  })

  it("e-mail inválido", async () => {
    setup()

    const result = await inviteMemberAction(
      undefined,
      form({ email: "invalido", role: "member" }),
    )

    expect(result?.error).toBeTruthy()
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })
})

describe("removeMemberAction", () => {
  function setup(targetRole: string | null, owners = 2) {
    const mock = createSupabaseMock({
      memberships: (calls) => {
        if (calls.some((call) => call.method === "delete")) {
          return { data: null, error: null }
        }
        if (hasCall(calls, "eq", "role", "owner")) {
          return { data: null, error: null, count: owners } as never
        }
        return {
          data: targetRole ? { role: targetRole } : null,
          error: null,
        }
      },
    })
    state.supabase = mock.client
    return mock
  }

  function deletes(mock: ReturnType<typeof setup>) {
    return mock
      .callsFor("memberships")
      .filter((calls) => calls.some((call) => call.method === "delete"))
  }

  it("admin remove um member do próprio tenant", async () => {
    as("admin")
    const mock = setup("member")

    await removeMemberAction(form({ user_id: OTHER }))

    const [del] = deletes(mock)
    expect(del).toBeDefined()
    expect(hasCall(del!, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(del!, "eq", "user_id", OTHER)).toBe(true)
  })

  it("member não remove ninguém", async () => {
    as("member")
    const mock = setup("member")

    await removeMemberAction(form({ user_id: OTHER }))

    expect(mock.client.from).not.toHaveBeenCalled()
  })

  it("admin não remove um owner", async () => {
    as("admin")
    const mock = setup("owner")

    await removeMemberAction(form({ user_id: OTHER }))

    expect(deletes(mock)).toEqual([])
  })

  it("owner não remove o último owner", async () => {
    as("owner")
    const mock = setup("owner", 1)

    await removeMemberAction(form({ user_id: OTHER }))

    expect(deletes(mock)).toEqual([])
  })

  it("owner remove outro owner quando há mais de um", async () => {
    as("owner")
    const mock = setup("owner", 2)

    await removeMemberAction(form({ user_id: OTHER }))

    expect(deletes(mock)).toHaveLength(1)
  })

  it("alvo fora do tenant é ignorado", async () => {
    as("owner")
    const mock = setup(null)

    await removeMemberAction(form({ user_id: OTHER }))

    expect(deletes(mock)).toEqual([])
  })
})
