import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"

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

import { updateSocialSettingsAction } from "@/server/actions/social"

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
