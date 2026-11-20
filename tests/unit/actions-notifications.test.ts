import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  membership: null as { tenantId: string } | null,
}))

vi.mock("@/lib/auth", () => ({ getUser: async () => state.user }))
vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/server/queries/notifications", () => ({
  listNotifications: vi.fn(async () => [{ id: "n1", title: "Oi" }]),
  unreadCount: vi.fn(async () => 3),
}))

import { listNotifications, unreadCount } from "@/server/queries/notifications"
import { getNotificationsAction } from "@/server/actions/notifications"

describe("getNotificationsAction", () => {
  beforeEach(() => {
    state.user = { id: "u1" }
    state.membership = { tenantId: "t1" }
    vi.mocked(listNotifications).mockClear()
  })

  it("sem usuário ou empresa, devolve vazio sem consultar", async () => {
    state.user = null
    await expect(getNotificationsAction()).resolves.toEqual({
      notifications: [],
      unread: 0,
    })
    expect(listNotifications).not.toHaveBeenCalled()
  })

  it("devolve as notificações e o total não lido do usuário", async () => {
    await expect(getNotificationsAction()).resolves.toEqual({
      notifications: [{ id: "n1", title: "Oi" }],
      unread: 3,
    })
    expect(listNotifications).toHaveBeenCalledWith("t1", "u1")
    expect(unreadCount).toHaveBeenCalledWith("t1", "u1")
  })
})
