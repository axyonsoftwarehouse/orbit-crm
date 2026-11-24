import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const CONTACT = "33333333-3333-4333-8333-333333333333"
const COMPANY = "44444444-4444-4444-8444-444444444444"
const INVITE = "55555555-5555-4555-8555-555555555555"
const TOKEN = "66666666-6666-4666-8666-666666666666"
const NEW_USER = "77777777-7777-4777-8777-777777777777"

const state = vi.hoisted(() => ({
  membership: null as {
    tenantId: string
    role: string
    tenant: { name: string }
  } | null,
  supabase: null as unknown,
  admin: null as unknown,
  emailSent: true,
  rateLimited: false,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({ getUser: async () => ({ id: USER }) }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async () => ({ sent: state.emailSent })),
}))
vi.mock("@/server/rate-limit", () => ({
  isLoginRateLimited: vi.fn(async () => state.rateLimited),
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
import { inviteContactToPortalAction } from "@/server/actions/contacts"
import { acceptPortalInvitationAction } from "@/server/actions/portal-invite"
import { lookupPortalInvitation } from "@/server/portal-invitations"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  state.membership = {
    tenantId: TENANT,
    role: "admin",
    tenant: { name: "Agência Axyon" },
  }
  state.emailSent = true
  state.rateLimited = false
  process.env.NEXT_PUBLIC_SITE_URL = "https://crm.test"
  vi.mocked(sendTenantEmail).mockClear()
})

describe("inviteContactToPortalAction", () => {
  const contact = (overrides: Record<string, unknown> = {}) => ({
    data: {
      id: CONTACT,
      email: "Marina@Padaria.test",
      first_name: "Marina",
      last_name: "Souza",
      user_id: null,
      ...overrides,
    },
    error: null,
  })

  function setup(contactResult = contact()) {
    const mock = createSupabaseMock({
      contacts: contactResult,
      portal_invitations: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: { token: TOKEN }, error: null }
          : { data: null, error: null },
    })
    state.supabase = mock.client
    return mock
  }

  const submit = () =>
    inviteContactToPortalAction(
      undefined,
      form({ contact_id: CONTACT, company_id: COMPANY }),
    )

  it("cria o convite (sem senha), substitui o pendente e manda o link por e-mail", async () => {
    const mock = setup()

    const result = await submit()

    expect(result).toEqual({
      success: "Convite enviado para marina@padaria.test.",
      inviteLink: `https://crm.test/portal/convite/${TOKEN}`,
    })
    const [revoke, insert] = mock.callsFor("portal_invitations")
    expect(hasCall(revoke, "delete")).toBe(true)
    expect(hasCall(revoke, "eq", "contact_id", CONTACT)).toBe(true)
    expect(hasCall(revoke, "is", "accepted_at", null)).toBe(true)
    expect(
      hasCall(insert, "insert", {
        tenant_id: TENANT,
        contact_id: CONTACT,
        email: "marina@padaria.test",
        invited_by: USER,
      }),
    ).toBe(true)
    const [contactCalls] = mock.callsFor("contacts")
    expect(hasCall(contactCalls, "eq", "tenant_id", TENANT)).toBe(true)

    const email = vi.mocked(sendTenantEmail).mock.calls[0][1]
    expect(email).toMatchObject({
      tenantId: TENANT,
      templateKey: "portal_invite",
      to: "marina@padaria.test",
      vars: {
        tenant: "Agência Axyon",
        name: "Marina",
        link: `https://crm.test/portal/convite/${TOKEN}`,
      },
    })
  })

  it("sem Resend, devolve o link para copiar", async () => {
    setup()
    state.emailSent = false

    const result = await submit()

    expect(result?.success).toBe(
      "Convite criado. Copie o link e envie ao cliente.",
    )
    expect(result?.inviteLink).toContain(TOKEN)
  })

  it("member não pode convidar", async () => {
    setup()
    state.membership = { ...state.membership!, role: "member" }

    expect((await submit())?.error).toMatch(/permissão/)
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("contato sem e-mail ou já com acesso é recusado", async () => {
    setup(contact({ email: null }))
    expect((await submit())?.error).toMatch(/e-mail/)

    setup(contact({ user_id: NEW_USER }))
    expect((await submit())?.error).toMatch(/já possui acesso/)
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })
})

const invitationRow = (overrides: Record<string, unknown> = {}) => ({
  id: INVITE,
  tenant_id: TENANT,
  contact_id: CONTACT,
  email: "marina@padaria.test",
  accepted_at: null,
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  tenant: { name: "Agência Axyon" },
  contact: {
    first_name: "Marina",
    email: "marina@padaria.test",
    user_id: null,
    deleted_at: null,
  },
  ...overrides,
})

describe("lookupPortalInvitation", () => {
  const lookup = (row: unknown, token = TOKEN) =>
    lookupPortalInvitation(
      createSupabaseMock({ portal_invitations: { data: row, error: null } })
        .client as never,
      token,
    )

  it("aceita convite válido", async () => {
    await expect(lookup(invitationRow())).resolves.toMatchObject({
      ok: true,
      invitation: { contactName: "Marina", tenantName: "Agência Axyon" },
    })
  })

  it("recusa token malformado sem consultar o banco", async () => {
    await expect(lookup(invitationRow(), "abc")).resolves.toEqual({
      ok: false,
      message: "Convite inválido.",
    })
  })

  it.each([
    ["usado", { accepted_at: "2026-01-01T00:00:00Z" }, /já foi utilizado/],
    ["expirado", { expires_at: "2020-01-01T00:00:00Z" }, /expirou/],
    [
      "contato já com acesso",
      { contact: { ...invitationRow().contact, user_id: NEW_USER } },
      /já possui acesso/,
    ],
    [
      "contato excluído",
      {
        contact: {
          ...invitationRow().contact,
          deleted_at: "2026-01-01T00:00:00Z",
        },
      },
      /inválido/,
    ],
    [
      "e-mail do contato mudou",
      { contact: { ...invitationRow().contact, email: "outra@padaria.test" } },
      /inválido/,
    ],
  ])("recusa convite %s", async (_label, overrides, message) => {
    const result = await lookup(invitationRow(overrides))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(message)
  })
})

describe("acceptPortalInvitationAction", () => {
  function setup(
    options: {
      profile?: unknown
      signInError?: unknown
      linked?: unknown
    } = {},
  ) {
    const admin = createSupabaseMock({
      portal_invitations: { data: invitationRow(), error: null },
      profiles: { data: options.profile ?? null, error: null },
      contacts: {
        data: options.linked === undefined ? { id: CONTACT } : options.linked,
        error: null,
      },
    })
    const createUser = vi.fn(async () => ({
      data: { user: { id: NEW_USER } },
      error: null,
    }))
    Object.assign(admin.client, { auth: { admin: { createUser } } })

    const supabase = createSupabaseMock()
    const signInWithPassword = vi.fn(async () => ({
      error: options.signInError ?? null,
    }))
    const signOut = vi.fn(async () => ({ error: null }))
    Object.assign(supabase.client, { auth: { signInWithPassword, signOut } })

    state.admin = admin.client
    state.supabase = supabase.client
    return { admin, createUser, signInWithPassword, signOut }
  }

  const submit = (password = "SenhaForte1", confirm = password) =>
    acceptPortalInvitationAction(
      undefined,
      form({ token: TOKEN, password, confirm }),
    )

  it("cria a conta com a senha do cliente, vincula o contato e entra", async () => {
    const { admin, createUser, signInWithPassword } = setup()

    await expect(submit()).rejects.toThrow("REDIRECT:/portal")

    expect(createUser).toHaveBeenCalledWith({
      email: "marina@padaria.test",
      password: "SenhaForte1",
      email_confirm: true,
      user_metadata: { full_name: "Marina" },
    })
    expect(signInWithPassword).toHaveBeenCalled()
    const [contactCalls] = admin.callsFor("contacts")
    expect(hasCall(contactCalls, "update", { user_id: NEW_USER })).toBe(true)
    expect(hasCall(contactCalls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(contactCalls, "is", "user_id", null)).toBe(true)
    const inviteCalls = admin.callsFor("portal_invitations")
    expect(
      inviteCalls.some((calls) => hasCall(calls, "eq", "id", INVITE)),
    ).toBe(true)
  })

  it("senhas diferentes ou curtas não chegam a criar conta", async () => {
    const { createUser } = setup()

    expect((await submit("SenhaForte1", "Outra123"))?.error).toBe(
      "As senhas não conferem.",
    )
    expect((await submit("curta"))?.error).toMatch(/8 caracteres/)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("e-mail que já tem conta exige a senha atual dela", async () => {
    const { createUser } = setup({
      profile: { id: NEW_USER },
      signInError: { message: "Invalid login credentials" },
    })

    expect((await submit())?.error).toMatch(/já tem uma conta/)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("conta existente com senha certa só é vinculada", async () => {
    const { admin, createUser } = setup({ profile: { id: NEW_USER } })

    await expect(submit()).rejects.toThrow("REDIRECT:/portal")
    expect(createUser).not.toHaveBeenCalled()
    const [contactCalls] = admin.callsFor("contacts")
    expect(hasCall(contactCalls, "update", { user_id: NEW_USER })).toBe(true)
  })

  it("conta existente respeita o limite de tentativas", async () => {
    const { signInWithPassword } = setup({ profile: { id: NEW_USER } })
    state.rateLimited = true

    expect((await submit())?.error).toMatch(/Muitas tentativas/)
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it("se o contato foi vinculado no meio do caminho, sai e não marca o convite", async () => {
    const { admin, signOut } = setup({ linked: null })

    expect((await submit())?.error).toMatch(/Peça um novo convite/)
    expect(signOut).toHaveBeenCalled()
    const inviteCalls = admin.callsFor("portal_invitations")
    expect(inviteCalls.some((calls) => hasCall(calls, "update"))).toBe(false)
  })
})
