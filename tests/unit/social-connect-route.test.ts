// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  native: true,
  user: { id: "user-1" } as { id: string } | null,
  active: {
    tenantId: "tenant-1",
    role: "owner" as "owner" | "admin" | "member",
  } as { tenantId: string; role: "owner" | "admin" | "member" } | null,
  provider: null as null | {
    isConfigured: boolean
    supportsAccountType: (type: string) => boolean
    getAuthUrl: (input: {
      redirectUri: string
      state: string
      accountType: string
    }) => string
  },
}))

vi.mock("@/lib/env", () => ({
  socialNativeEnabled: () => state.native,
}))

vi.mock("@/lib/auth", () => ({
  getUser: async () => state.user,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.active,
}))

vi.mock("@/server/social/oauth", () => ({
  COOKIE_NAME: "orbit.social.oauth",
  getOAuthRedirectUri: (provider: string) =>
    `https://app.example/api/social/callback/${provider}`,
  createOAuthState: async (
    provider: string,
    type: string,
    tenantId: string,
    userId: string,
  ) => ({
    state: "state-1",
    cookie: `${provider}:${type}:${tenantId}:${userId}:state-1`,
  }),
  oauthCookieOptions: () => ({ httpOnly: true }),
}))

vi.mock("@/server/social", () => ({
  getSocialProvider: () => state.provider,
}))

import { GET } from "@/app/api/social/connect/[provider]/route"

const provider = {
  isConfigured: true,
  supportsAccountType: () => true,
  getAuthUrl: () => "https://provider.example/authorize",
}

function call(url = "https://app.example/api/social/connect/instagram") {
  return GET(new Request(url), {
    params: Promise.resolve({
      provider: new URL(url).pathname.split("/").pop() ?? "instagram",
    }),
  })
}

function location(response: Response) {
  return response.headers.get("location")
}

function cookie(response: Response) {
  return decodeURIComponent(response.headers.get("set-cookie") ?? "")
}

beforeEach(() => {
  state.native = true
  state.user = { id: "user-1" }
  state.active = { tenantId: "tenant-1", role: "owner" }
  state.provider = provider
})

describe("GET /api/social/connect/[provider]", () => {
  it("exige sessão ativa", async () => {
    state.active = null
    const response = await call()
    expect(response.status).toBe(307)
    expect(location(response)).toBe("https://app.example/login")
  })

  it("exige usuário autenticado", async () => {
    state.user = null
    const response = await call()
    expect(location(response)).toBe("https://app.example/login")
  })

  it("recusa membro comum", async () => {
    state.active = { tenantId: "tenant-1", role: "member" }
    const response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=permission",
    )
  })

  it("recusa quando o modo nativo está desligado", async () => {
    state.native = false
    const response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=disabled",
    )
  })

  it("recusa provedor desconhecido ou não configurado", async () => {
    state.provider = null
    let response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=provider",
    )

    state.provider = { ...provider, isConfigured: false }
    response = await call()
    expect(location(response)).toBe(
      "https://app.example/app/social/contas?error=not_configured",
    )
  })

  it("redireciona ao provedor com cookie de state", async () => {
    const response = await call()
    expect(location(response)).toBe("https://provider.example/authorize")
    expect(cookie(response)).toContain(
      "orbit.social.oauth=instagram:instagram:tenant-1:user-1:state-1",
    )
  })

  it("passa o tipo da Página do LinkedIn", async () => {
    const response = await call(
      "https://app.example/api/social/connect/linkedin?type=organization",
    )
    expect(location(response)).toBe("https://provider.example/authorize")
    expect(cookie(response)).toContain(
      "linkedin:organization:tenant-1:user-1:state-1",
    )
  })
})
