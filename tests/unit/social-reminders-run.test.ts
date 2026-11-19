import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const AUTHOR = "22222222-2222-4222-8222-222222222222"
const POST = "33333333-3333-4333-8333-333333333333"

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

import { createNotification } from "@/server/notifications"
import { runSocialPublishReminders } from "@/server/social/reminders"

describe("runSocialPublishReminders", () => {
  beforeEach(() => vi.mocked(createNotification).mockClear())

  it("não lembra o autor que saiu do tenant; avisa owner/admin", async () => {
    const admin = createSupabaseMock({
      social_posts: {
        data: [
          {
            id: POST,
            tenant_id: TENANT,
            content: "Post de teste",
            scheduled_at: new Date().toISOString(),
            created_by: AUTHOR,
          },
        ],
        error: null,
      },
      social_post_targets: { data: [], error: null },
      social_settings: { data: [], error: null },
      memberships: (calls) =>
        hasCall(calls, "eq", "user_id", AUTHOR)
          ? { data: null, error: null }
          : { data: [{ user_id: "a1" }], error: null },
      profiles: { data: { email: null, notify_email: true }, error: null },
    })
    state.admin = admin.client

    const result = await runSocialPublishReminders()

    expect(result.notifications).toBe(1)
    expect(
      vi.mocked(createNotification).mock.calls.map(([, input]) => input.userId),
    ).toEqual(["a1"])
  })
})
