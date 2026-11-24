import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const CREATOR = "22222222-2222-4222-8222-222222222222"
const ESTIMATE = "33333333-3333-4333-8333-333333333333"
const COMPANY = "44444444-4444-4444-8444-444444444444"
const TICKET = "55555555-5555-4555-8555-555555555555"
const ASSIGNEE = "66666666-6666-4666-8666-666666666666"
const OWNER = "77777777-7777-4777-8777-777777777777"
const ADMIN = "88888888-8888-4888-8888-888888888888"
const CONTACT = "99999999-9999-4999-8999-999999999999"

const state = vi.hoisted(() => ({ admin: null as unknown }))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async () => ({ sent: true })),
}))
vi.mock("@/server/notifications", () => ({
  createNotification: vi.fn(async () => true),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { logger } from "@/lib/logger"
import { sendTenantEmail } from "@/server/email"
import { createNotification } from "@/server/notifications"
import {
  notifyClientTicketReply,
  notifyStaffEstimateResponse,
  notifyStaffTicketOpened,
  notifyStaffTicketReply,
} from "@/server/portal-notifications"

/** `memberships`: o preferido é membro ativo? senão devolve owner/admin. */
function memberships(preferredActive: boolean) {
  return (calls: { method: string; args: unknown[] }[]) => {
    const isPreferredLookup = calls.some(
      (call) => call.method === "eq" && call.args[0] === "user_id",
    )
    if (isPreferredLookup) {
      return {
        data: preferredActive ? { user_id: calls[2]?.args[1] } : null,
        error: null,
      }
    }
    return { data: [{ user_id: OWNER }, { user_id: ADMIN }], error: null }
  }
}

const profiles = (notifyEmail = true) => ({
  data: { email: "equipe@agencia.test", notify_email: notifyEmail },
  error: null,
})

const ticket = (overrides: Record<string, unknown> = {}) => ({
  data: {
    id: TICKET,
    tenant_id: TENANT,
    company_id: COMPANY,
    contact_id: CONTACT,
    formatted_number: "TCK-000007",
    subject: "Site fora do ar",
    assignee_id: null,
    ...overrides,
  },
  error: null,
})

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://crm.test"
  vi.mocked(sendTenantEmail).mockReset()
  vi.mocked(sendTenantEmail).mockResolvedValue({ sent: true })
  vi.mocked(createNotification).mockReset()
  vi.mocked(createNotification).mockResolvedValue(true)
  vi.mocked(logger.error).mockClear()
})

describe("notifyStaffEstimateResponse", () => {
  const estimate = {
    data: {
      id: ESTIMATE,
      tenant_id: TENANT,
      company_id: COMPANY,
      formatted_number: "ORC-000012",
      created_by: CREATOR,
    },
    error: null,
  }

  it("avisa o criador do orçamento no app e por e-mail quando o cliente aceita", async () => {
    const admin = createSupabaseMock({
      estimates: estimate,
      companies: { data: { name: "Padaria Sol" }, error: null },
      memberships: memberships(true),
      profiles: profiles(),
    })
    state.admin = admin.client

    const result = await notifyStaffEstimateResponse({
      estimateId: ESTIMATE,
      accepted: true,
    })

    expect(result).toEqual({ notifications: 1, emails: 1 })
    const notification = vi.mocked(createNotification).mock.calls[0][1]
    expect(notification).toMatchObject({
      tenantId: TENANT,
      userId: CREATOR,
      type: "portal_estimate_response",
      title: "Padaria Sol aceitou o orçamento ORC-000012",
      url: `/app/orcamentos/${ESTIMATE}`,
    })
    const email = vi.mocked(sendTenantEmail).mock.calls[0][1]
    expect(email.templateKey).toBe("portal_estimate_response")
    expect(email.vars).toMatchObject({
      decision: "aceitou",
      number: "ORC-000012",
      url: `https://crm.test/app/orcamentos/${ESTIMATE}`,
    })
    const [estimateCalls] = admin.callsFor("estimates")
    expect(hasCall(estimateCalls, "is", "deleted_at", null)).toBe(true)
  })

  it("sem criador ativo, avisa owner/admin; recusa vira 'recusou'", async () => {
    state.admin = createSupabaseMock({
      estimates: estimate,
      memberships: memberships(false),
      profiles: profiles(false),
    }).client

    const result = await notifyStaffEstimateResponse({
      estimateId: ESTIMATE,
      accepted: false,
    })

    expect(result).toEqual({ notifications: 2, emails: 0 })
    const calls = vi.mocked(createNotification).mock.calls
    expect(calls.map(([, input]) => input.userId)).toEqual([OWNER, ADMIN])
    expect(calls[0][1].title).toBe("O cliente recusou o orçamento ORC-000012")
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("orçamento inexistente não avisa ninguém", async () => {
    state.admin = createSupabaseMock({
      estimates: { data: null, error: null },
    }).client

    await expect(
      notifyStaffEstimateResponse({ estimateId: ESTIMATE, accepted: true }),
    ).resolves.toEqual({ notifications: 0, emails: 0 })
    expect(createNotification).not.toHaveBeenCalled()
  })

  it("falha inesperada é logada e não estoura", async () => {
    state.admin = {
      from: () => {
        throw new Error("boom")
      },
    }

    await expect(
      notifyStaffEstimateResponse({ estimateId: ESTIMATE, accepted: true }),
    ).resolves.toEqual({ notifications: 0, emails: 0 })
    expect(logger.error).toHaveBeenCalledWith(
      "portal.estimate_response_notify_failed",
      expect.objectContaining({ error: "boom" }),
    )
  })
})

describe("notifyStaffTicketOpened", () => {
  it("ticket novo sem responsável avisa owner/admin com o resumo", async () => {
    const admin = createSupabaseMock({
      tickets: ticket(),
      companies: { data: { name: "Padaria Sol" }, error: null },
      memberships: memberships(false),
      profiles: profiles(),
    })
    state.admin = admin.client

    const result = await notifyStaffTicketOpened({
      tenantId: TENANT,
      companyId: COMPANY,
      ticketId: TICKET,
      details: "O site   está\nfora do ar desde cedo.",
    })

    expect(result).toEqual({ notifications: 2, emails: 2 })
    const notification = vi.mocked(createNotification).mock.calls[0][1]
    expect(notification).toMatchObject({
      type: "portal_ticket_opened",
      title: "Novo ticket de Padaria Sol: TCK-000007 Site fora do ar",
      body: "O site está fora do ar desde cedo.",
      url: `/app/tickets/${TICKET}`,
    })
    expect(vi.mocked(sendTenantEmail).mock.calls[0][1].templateKey).toBe(
      "portal_ticket_opened",
    )
    const [ticketCalls] = admin.callsFor("tickets")
    expect(hasCall(ticketCalls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(ticketCalls, "eq", "company_id", COMPANY)).toBe(true)
  })

  it("ticket de outro cliente não gera aviso", async () => {
    state.admin = createSupabaseMock({
      tickets: { data: null, error: null },
    }).client

    await expect(
      notifyStaffTicketOpened({
        tenantId: TENANT,
        companyId: COMPANY,
        ticketId: TICKET,
      }),
    ).resolves.toEqual({ notifications: 0, emails: 0 })
    expect(createNotification).not.toHaveBeenCalled()
  })
})

describe("notifyStaffTicketReply", () => {
  it("avisa o responsável ativo pelo ticket", async () => {
    state.admin = createSupabaseMock({
      tickets: ticket({ assignee_id: ASSIGNEE }),
      companies: { data: { name: "Padaria Sol" }, error: null },
      memberships: memberships(true),
      profiles: profiles(),
    }).client

    const result = await notifyStaffTicketReply({
      tenantId: TENANT,
      companyId: COMPANY,
      ticketId: TICKET,
      body: "Voltou, obrigado!",
    })

    expect(result).toEqual({ notifications: 1, emails: 1 })
    const notification = vi.mocked(createNotification).mock.calls[0][1]
    expect(notification).toMatchObject({
      userId: ASSIGNEE,
      type: "portal_ticket_reply",
      title: "Padaria Sol respondeu o ticket TCK-000007",
      body: "Voltou, obrigado!",
    })
  })

  it("um destinatário que falha não impede os outros", async () => {
    state.admin = createSupabaseMock({
      tickets: ticket(),
      memberships: memberships(false),
      profiles: profiles(),
    }).client
    vi.mocked(createNotification)
      .mockRejectedValueOnce(new Error("insert falhou"))
      .mockResolvedValueOnce(true)

    const result = await notifyStaffTicketReply({
      tenantId: TENANT,
      companyId: COMPANY,
      ticketId: TICKET,
      body: "Oi",
    })

    expect(result).toEqual({ notifications: 1, emails: 1 })
    expect(logger.error).toHaveBeenCalledWith(
      "portal.ticket_reply_notify_failed",
      expect.objectContaining({ error: "insert falhou" }),
    )
  })
})

describe("notifyClientTicketReply", () => {
  it("manda e-mail ao contato com portal que abriu o ticket", async () => {
    const admin = createSupabaseMock({
      tickets: ticket(),
      contacts: { data: { email: " ana@cliente.test " }, error: null },
      tenants: { data: { name: "Agência Axyon" }, error: null },
    })
    state.admin = admin.client

    const result = await notifyClientTicketReply({
      tenantId: TENANT,
      ticketId: TICKET,
      body: "Já corrigimos.",
    })

    expect(result).toEqual({ emails: 1 })
    const email = vi.mocked(sendTenantEmail).mock.calls[0][1]
    expect(email.to).toBe("ana@cliente.test")
    expect(email.templateKey).toBe("ticket_reply_client")
    expect(email.vars).toMatchObject({
      tenant: "Agência Axyon",
      number: "TCK-000007",
      message: "Já corrigimos.",
      url: `https://crm.test/portal/tickets/${TICKET}`,
    })
    const [contactCalls] = admin.callsFor("contacts")
    expect(hasCall(contactCalls, "not", "user_id", "is", null)).toBe(true)
    expect(hasCall(contactCalls, "eq", "tenant_id", TENANT)).toBe(true)
  })

  it("ticket sem contato (aberto pela equipe) não manda e-mail", async () => {
    state.admin = createSupabaseMock({
      tickets: ticket({ contact_id: null }),
    }).client

    await expect(
      notifyClientTicketReply({
        tenantId: TENANT,
        ticketId: TICKET,
        body: "x",
      }),
    ).resolves.toEqual({ emails: 0 })
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("contato sem acesso ao portal não recebe e-mail", async () => {
    state.admin = createSupabaseMock({
      tickets: ticket(),
      contacts: { data: null, error: null },
    }).client

    await expect(
      notifyClientTicketReply({
        tenantId: TENANT,
        ticketId: TICKET,
        body: "x",
      }),
    ).resolves.toEqual({ emails: 0 })
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })
})
