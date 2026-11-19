import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  portalContact: null as { company_id: string } | null,
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
vi.mock("@/server/queries/portal", () => ({
  getPortalContact: async () => state.portalContact,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/server/social/approval-notifications", () => ({
  notifyPortalApprovalRequested: vi.fn(async () => ({ emails: 1 })),
  notifyStaffPortalResponse: vi.fn(async () => ({
    notifications: 1,
    emails: 1,
  })),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  notifyPortalApprovalRequested,
  notifyStaffPortalResponse,
} from "@/server/social/approval-notifications"
import {
  respondPortalSocialPostAction,
  submitSocialPostAction,
  updateSocialSettingsAction,
} from "@/server/actions/social"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function as(role: string) {
  state.membership = { tenantId: TENANT, role }
}

describe("updateSocialSettingsAction", () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    mock = createSupabaseMock()
    state.supabase = mock.client
  })

  it("recusa member sem gravar", async () => {
    as("member")
    const result = await updateSocialSettingsAction(
      undefined,
      form({ approval_required: "on" }),
    )
    expect(result?.error).toBeTruthy()
    expect(mock.callsFor("social_settings")).toHaveLength(0)
  })

  it("liga a aprovação obrigatória para admin", async () => {
    as("admin")
    const result = await updateSocialSettingsAction(
      undefined,
      form({ approval_required: "on" }),
    )
    expect(result?.success).toBeTruthy()
    const [calls] = mock.callsFor("social_settings")
    expect(
      hasCall(
        calls,
        "upsert",
        { tenant_id: TENANT, approval_required: true },
        { onConflict: "tenant_id" },
      ),
    ).toBe(true)
  })

  it("desliga quando o campo não vem", async () => {
    as("owner")
    await updateSocialSettingsAction(undefined, form({}))
    const [calls] = mock.callsFor("social_settings")
    expect(
      hasCall(
        calls,
        "upsert",
        { tenant_id: TENANT, approval_required: false },
        { onConflict: "tenant_id" },
      ),
    ).toBe(true)
  })
})

const POST = "33333333-3333-4333-8333-333333333333"
const COMPANY = "44444444-4444-4444-8444-444444444444"

describe("submitSocialPostAction", () => {
  beforeEach(() => {
    as("member")
    vi.mocked(notifyPortalApprovalRequested).mockClear()
  })

  function setup(updatedRows: unknown[]) {
    state.supabase = createSupabaseMock({
      social_posts: (calls) =>
        calls.some((call) => call.method === "update")
          ? { data: updatedRows, error: null }
          : { data: { id: POST, status: "draft" }, error: null },
    }).client
  }

  it("avisa o cliente quando o post entra em aprovação", async () => {
    setup([{ id: POST }])
    await expect(submitSocialPostAction(form({ id: POST }))).rejects.toThrow(
      `REDIRECT:/app/social/${POST}`,
    )
    expect(notifyPortalApprovalRequested).toHaveBeenCalledWith({
      tenantId: TENANT,
      postId: POST,
    })
  })

  it("não avisa quando nenhuma linha mudou", async () => {
    setup([])
    await expect(submitSocialPostAction(form({ id: POST }))).rejects.toThrow(
      "REDIRECT",
    )
    expect(notifyPortalApprovalRequested).not.toHaveBeenCalled()
  })
})

describe("respondPortalSocialPostAction", () => {
  beforeEach(() => {
    state.portalContact = { company_id: COMPANY }
    vi.mocked(notifyStaffPortalResponse).mockClear()
  })

  function setup(rpcData: boolean) {
    state.supabase = createSupabaseMock(
      {},
      { portal_respond_social_post: { data: rpcData, error: null } },
    ).client
  }

  it("avisa a equipe quando o RPC registra a resposta", async () => {
    setup(true)
    await expect(
      respondPortalSocialPostAction(
        form({ post_id: POST, approve: "0", note: "Trocar a foto" }),
      ),
    ).rejects.toThrow("REDIRECT:/portal/social")
    expect(notifyStaffPortalResponse).toHaveBeenCalledWith({
      postId: POST,
      companyId: COMPANY,
      approved: false,
      note: "Trocar a foto",
    })
  })

  it("não avisa quando o RPC recusa (post já respondido)", async () => {
    setup(false)
    await expect(
      respondPortalSocialPostAction(form({ post_id: POST, approve: "1" })),
    ).rejects.toThrow("REDIRECT")
    expect(notifyStaffPortalResponse).not.toHaveBeenCalled()
  })
})
