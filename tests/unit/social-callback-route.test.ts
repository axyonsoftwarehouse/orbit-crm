// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  native: true,
  user: { id: "user-1" } as { id: string } | null,
  active: { tenantId: "tenant-1" } as { tenantId: string } | null,
  oauth: {
    accountType: "instagram",
    tenantId: "tenant-1",
    userId: "user-1",
  } as {
    accountType: "instagram" | "member" | "organization"
    tenantId: string
    userId: string
  } | null,
  existing: null as null | { id: string; metadata: Record<string, unknown> },
  limitOk: true,
}))

const exchangeMock = vi.hoisted(() => vi.fn())
const storeTokensMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/env", () => ({
  socialNativeEnabled: () => state.native,
}))

vi.mock("@/lib/auth", () => ({
  getUser: async () => state.user,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.active,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/server/social", () => ({
  getSocialProvider: () => ({
    isConfigured: true,
    exchangeCode: exchangeMock,
  }),
}))

vi.mock("@/server/plan-limits", () => ({
  checkPlanLimitWith: async () => ({ ok: state.limitOk }),
}))

vi.mock("@/server/social/oauth", () => ({
  getOAuthRedirectUri: (provider: string) =>
    `https://app.example/api/social/callback/${provider}`,
  readOAuthState: async () => state.oauth,
}))

vi.mock("@/server/social/tokens", () => ({
  storeSocialTokens: storeTokensMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "social_accounts") {
        const chain: Record<string, unknown> = {
          select: () => chain,
          eq: () => chain,
          is: () => chain,
          maybeSingle: async () => ({ data: state.existing, error: null }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "acc-1" }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({ eq: async () => ({ error: null }) }),
          }),
        }
        return chain
      }
      if (table === "social_settings") {
        return { upsert: async () => ({ error: null }) }
      }
      throw new Error(`tabela inesperada: ${table}`)
    },
  }),
}))

import { GET } from "@/app/api/social/callback/[provider]/route"

function call(query = "?code=code&state=state-1", provider = "instagram") {
  return GET(
    new Request(`https://app.example/api/social/callback/${provider}${query}`),
    { params: Promise.resolve({ provider }) },
  )
}

function location(response: Response) {
  return response.headers.get("location")
}

beforeEach(() => {
  state.native = true
  state.user = { id: "user-1" }
  state.active = { tenantId: "tenant-1" }
  state.oauth = {
    accountType: "instagram",
    tenantId: "tenant-1",
    userId: "user-1",
  }
  state.existing = null
  state.limitOk = true
  exchangeMock.mockReset()
  exchangeMock.mockResolvedValue({
    tokens: {
      accessToken: "token",
      refreshToken: null,
      expiresAt: null,
      scopes: ["instagram_business_basic"],
    },
    profile: {
      id: "1789",
      name: "orbit",
      avatarUrl: null,
      accountType: "instagram",
      metadata: { username: "orbit" },
    },
  })
  storeTokensMock.mockReset()
  storeTokensMock.mockResolvedValue(undefined)
})

describe("GET /api/social/callback/[provider]", () => {
  it("repassa o erro do provedor", async () => {
    const response = await call("?error=access_denied")
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=denied&detail=access_denied",
    )
    expect(exchangeMock).not.toHaveBeenCalled()
  })

  it("não processa com o modo nativo desligado", async () => {
    state.native = false
    const response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=disabled",
    )
  })

  it("recusa state inválido ou de outro tenant/usuário", async () => {
    state.oauth = null
    let response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=state",
    )

    state.oauth = {
      accountType: "instagram",
      tenantId: "tenant-2",
      userId: "user-1",
    }
    response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=state",
    )
    expect(exchangeMock).not.toHaveBeenCalled()
  })

  it("aplica o limite de plano em conta nova", async () => {
    state.limitOk = false
    const response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=plan_limit",
    )
    expect(storeTokensMock).not.toHaveBeenCalled()
  })

  it("conecta a conta nova, grava tokens e liga o modo provider", async () => {
    const response = await call()

    expect(location(response)).toBe(
      "https://app.example/app/social/contas?connected=instagram",
    )
    expect(exchangeMock).toHaveBeenCalledWith({
      code: "code",
      redirectUri: "https://app.example/api/social/callback/instagram",
      accountType: "instagram",
    })
    expect(storeTokensMock).toHaveBeenCalledWith(
      "acc-1",
      expect.objectContaining({ accessToken: "token" }),
    )
  })

  it("atualiza a conta existente sem inserir outra", async () => {
    state.existing = { id: "acc-9", metadata: { antigo: true } }

    const response = await call()

    expect(location(response)).toBe(
      "https://app.example/app/social/contas?connected=instagram",
    )
    expect(storeTokensMock).toHaveBeenCalledWith(
      "acc-9",
      expect.objectContaining({ accessToken: "token" }),
    )
  })
})
