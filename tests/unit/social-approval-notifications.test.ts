import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const POST = "33333333-3333-4333-8333-333333333333"
const COMPANY = "44444444-4444-4444-8444-444444444444"
const AUTHOR = "22222222-2222-4222-8222-222222222222"

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
  notifyPortalApprovalRequested,
  notifyStaffPortalResponse,
} from "@/server/social/approval-notifications"

const post = (overrides: Record<string, unknown> = {}) => ({
  data: {
    id: POST,
    tenant_id: TENANT,
    company_id: COMPANY,
    content: "Lançamento da coleção de verão",
    created_by: AUTHOR,
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

describe("notifyPortalApprovalRequested", () => {
  it("manda e-mail só aos contatos com portal e e-mail do cliente do post", async () => {
    const admin = createSupabaseMock({
      social_posts: post(),
      companies: { data: { name: "Padaria Sol" }, error: null },
      contacts: {
        data: [
          { email: "ana@cliente.test" },
          { email: null },
          { email: "bia@cliente.test" },
        ],
        error: null,
      },
    })
    state.admin = admin.client

    const result = await notifyPortalApprovalRequested({
      tenantId: TENANT,
      postId: POST,
    })

    expect(result).toEqual({ emails: 2 })
    const [contactCalls] = admin.callsFor("contacts")
    expect(hasCall(contactCalls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(contactCalls, "eq", "company_id", COMPANY)).toBe(true)
    expect(hasCall(contactCalls, "not", "user_id", "is", null)).toBe(true)
    expect(hasCall(contactCalls, "is", "deleted_at", null)).toBe(true)
    const [postCalls] = admin.callsFor("social_posts")
    expect(hasCall(postCalls, "eq", "tenant_id", TENANT)).toBe(true)

    const calls = vi.mocked(sendTenantEmail).mock.calls
    expect(calls.map(([, params]) => params.to)).toEqual([
      "ana@cliente.test",
      "bia@cliente.test",
    ])
    expect(calls[0][1].templateKey).toBe("social_approval_requested")
    expect(calls[0][1].vars.url).toBe(`https://crm.test/portal/social/${POST}`)
    expect(calls[0][1].vars.company).toBe("Padaria Sol")
  })

  it("não manda dois e-mails para o mesmo endereço", async () => {
    state.admin = createSupabaseMock({
      social_posts: post(),
      contacts: {
        data: [{ email: "Ana@Cliente.test" }, { email: "ana@cliente.test " }],
        error: null,
      },
    }).client

    const result = await notifyPortalApprovalRequested({
      tenantId: TENANT,
      postId: POST,
    })

    expect(result).toEqual({ emails: 1 })
    expect(
      vi.mocked(sendTenantEmail).mock.calls.map(([, params]) => params.to),
    ).toEqual(["ana@cliente.test"])
  })

  it("um envio que falha não impede os outros", async () => {
    state.admin = createSupabaseMock({
      social_posts: post(),
      contacts: {
        data: [{ email: "ana@cliente.test" }, { email: "bia@cliente.test" }],
        error: null,
      },
    }).client
    vi.mocked(sendTenantEmail)
      .mockRejectedValueOnce(new Error("smtp"))
      .mockResolvedValueOnce({ sent: true })

    const result = await notifyPortalApprovalRequested({
      tenantId: TENANT,
      postId: POST,
    })

    expect(result).toEqual({ emails: 1 })
    expect(sendTenantEmail).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenCalled()
  })

  it("não envia nada quando o post não existe", async () => {
    state.admin = createSupabaseMock({
      social_posts: { data: null, error: null },
    }).client

    const result = await notifyPortalApprovalRequested({
      tenantId: TENANT,
      postId: POST,
    })

    expect(result).toEqual({ emails: 0 })
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("engole falha de envio e loga", async () => {
    state.admin = createSupabaseMock({
      social_posts: post(),
      contacts: { data: [{ email: "ana@cliente.test" }], error: null },
    }).client
    vi.mocked(sendTenantEmail).mockRejectedValue(new Error("smtp"))

    await expect(
      notifyPortalApprovalRequested({ tenantId: TENANT, postId: POST }),
    ).resolves.toEqual({ emails: 0 })
    expect(logger.error).toHaveBeenCalled()
  })
})

describe("notifyStaffPortalResponse", () => {
  it("avisa o autor no app e por e-mail quando o cliente aprova", async () => {
    const admin = createSupabaseMock({
      social_posts: post(),
      memberships: { data: { user_id: AUTHOR }, error: null },
      profiles: {
        data: { email: "autor@agencia.test", notify_email: true },
        error: null,
      },
    })
    state.admin = admin.client

    const result = await notifyStaffPortalResponse({
      postId: POST,
      companyId: COMPANY,
      approved: true,
    })

    expect(result).toEqual({ notifications: 1, emails: 1 })
    const [postCalls] = admin.callsFor("social_posts")
    expect(hasCall(postCalls, "eq", "company_id", COMPANY)).toBe(true)
    const [notification] = vi.mocked(createNotification).mock.calls[0].slice(1)
    expect(notification).toMatchObject({
      tenantId: TENANT,
      userId: AUTHOR,
      type: "social_approval_response",
      url: `/app/social/${POST}`,
    })
    const [, email] = vi.mocked(sendTenantEmail).mock.calls[0]
    expect(email.templateKey).toBe("social_approval_response")
    expect(email.vars.decision).toBe("aprovou")
    expect(email.vars.note).toBe("")
    expect(email.vars.url).toBe(`https://crm.test/app/social/${POST}`)
  })

  it("sem autor, avisa os owner/admin ativos do tenant", async () => {
    const admin = createSupabaseMock({
      social_posts: post({ created_by: null }),
      memberships: {
        data: [{ user_id: "a1" }, { user_id: "a2" }],
        error: null,
      },
      profiles: { data: { email: null, notify_email: true }, error: null },
    })
    state.admin = admin.client

    const result = await notifyStaffPortalResponse({
      postId: POST,
      companyId: COMPANY,
      approved: false,
      note: "Trocar a foto",
    })

    expect(result).toEqual({ notifications: 2, emails: 0 })
    const [memberCalls] = admin.callsFor("memberships")
    expect(hasCall(memberCalls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(memberCalls, "eq", "status", "active")).toBe(true)
    expect(hasCall(memberCalls, "in", "role", ["owner", "admin"])).toBe(true)
    expect(
      vi.mocked(createNotification).mock.calls.map(([, input]) => input.userId),
    ).toEqual(["a1", "a2"])
  })

  it("autor que saiu do tenant não é avisado; owner/admin recebem", async () => {
    const admin = createSupabaseMock({
      social_posts: post(),
      memberships: (calls) =>
        hasCall(calls, "eq", "user_id", AUTHOR)
          ? { data: null, error: null }
          : { data: [{ user_id: "a1" }], error: null },
      profiles: { data: { email: null, notify_email: true }, error: null },
    })
    state.admin = admin.client

    const result = await notifyStaffPortalResponse({
      postId: POST,
      companyId: COMPANY,
      approved: true,
    })

    expect(result).toEqual({ notifications: 1, emails: 0 })
    const [authorCheck] = admin.callsFor("memberships")
    expect(hasCall(authorCheck, "eq", "user_id", AUTHOR)).toBe(true)
    expect(hasCall(authorCheck, "eq", "status", "active")).toBe(true)
    expect(
      vi.mocked(createNotification).mock.calls.map(([, input]) => input.userId),
    ).toEqual(["a1"])
  })

  it("não conta notificação cujo insert falhou", async () => {
    state.admin = createSupabaseMock({
      social_posts: post(),
      memberships: { data: { user_id: AUTHOR }, error: null },
      profiles: { data: { email: null, notify_email: true }, error: null },
    }).client
    vi.mocked(createNotification).mockResolvedValue(false)

    const result = await notifyStaffPortalResponse({
      postId: POST,
      companyId: COMPANY,
      approved: true,
    })

    expect(result).toEqual({ notifications: 0, emails: 0 })
  })

  it("respeita notify_email desligado", async () => {
    state.admin = createSupabaseMock({
      social_posts: post(),
      memberships: { data: { user_id: AUTHOR }, error: null },
      profiles: {
        data: { email: "autor@agencia.test", notify_email: false },
        error: null,
      },
    }).client

    const result = await notifyStaffPortalResponse({
      postId: POST,
      companyId: COMPANY,
      approved: false,
      note: "Trocar a foto",
    })

    expect(result).toEqual({ notifications: 1, emails: 0 })
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })
})
