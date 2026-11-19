import { describe, expect, it } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"
import {
  resolveSocialRecipients,
  uniqueEmails,
} from "@/server/social/recipients"

const TENANT = "11111111-1111-4111-8111-111111111111"
const AUTHOR = "22222222-2222-4222-8222-222222222222"

describe("resolveSocialRecipients", () => {
  it("devolve o autor quando ele ainda é membro ativo", async () => {
    const admin = createSupabaseMock({
      memberships: { data: { user_id: AUTHOR }, error: null },
    })

    await expect(
      resolveSocialRecipients(admin.client as never, TENANT, AUTHOR),
    ).resolves.toEqual([AUTHOR])

    const [calls] = admin.callsFor("memberships")
    expect(hasCall(calls, "eq", "tenant_id", TENANT)).toBe(true)
    expect(hasCall(calls, "eq", "user_id", AUTHOR)).toBe(true)
    expect(hasCall(calls, "eq", "status", "active")).toBe(true)
  })

  it("troca o autor que saiu pelos owner/admin ativos", async () => {
    const admin = createSupabaseMock({
      memberships: (calls) =>
        hasCall(calls, "eq", "user_id", AUTHOR)
          ? { data: null, error: null }
          : { data: [{ user_id: "a1" }, { user_id: "a2" }], error: null },
    })

    await expect(
      resolveSocialRecipients(admin.client as never, TENANT, AUTHOR),
    ).resolves.toEqual(["a1", "a2"])

    const [, adminCalls] = admin.callsFor("memberships")
    expect(hasCall(adminCalls, "in", "role", ["owner", "admin"])).toBe(true)
    expect(hasCall(adminCalls, "eq", "status", "active")).toBe(true)
  })

  it("sem autor, vai direto para owner/admin", async () => {
    const admin = createSupabaseMock({
      memberships: { data: [{ user_id: "a1" }], error: null },
    })

    await expect(
      resolveSocialRecipients(admin.client as never, TENANT, null),
    ).resolves.toEqual(["a1"])
    expect(admin.callsFor("memberships")).toHaveLength(1)
  })
})

describe("uniqueEmails", () => {
  it("remove vazios e repetidos sem diferenciar maiúsculas e espaços", () => {
    expect(
      uniqueEmails([
        "Ana@Cliente.test",
        null,
        " ana@cliente.test ",
        "",
        "bia@cliente.test",
      ]),
    ).toEqual(["ana@cliente.test", "bia@cliente.test"])
  })
})
