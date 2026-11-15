import { beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({
  siteUrl: "https://app.example",
}))

const cookieState = vi.hoisted(() => ({
  value: "",
}))

vi.mock("@/lib/env", () => ({
  env: () => ({ NEXT_PUBLIC_SITE_URL: envState.siteUrl }),
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieState.value ? { name, value: cookieState.value } : undefined,
  }),
}))

import {
  createOAuthState,
  getOAuthRedirectUri,
  oauthCookieOptions,
  readOAuthState,
} from "@/server/social/oauth"

beforeEach(() => {
  envState.siteUrl = "https://app.example"
  cookieState.value = ""
})

describe("OAuth helpers", () => {
  it("monta a redirect_uri sem barra duplicada", () => {
    expect(getOAuthRedirectUri("linkedin")).toBe(
      "https://app.example/api/social/callback/linkedin",
    )

    envState.siteUrl = "https://app.example/"
    expect(getOAuthRedirectUri("instagram")).toBe(
      "https://app.example/api/social/callback/instagram",
    )
  })

  it("cria um state aleatório e o payload do cookie", async () => {
    const result = await createOAuthState(
      "linkedin",
      "organization",
      "tenant-1",
      "user-1",
    )

    expect(result.state).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.cookie).toBe(
      `linkedin:organization:tenant-1:user-1:${result.state}`,
    )
  })

  it("lê o state válido do cookie", async () => {
    cookieState.value = "linkedin:organization:tenant-1:user-1:state-1"

    await expect(readOAuthState("linkedin", "state-1")).resolves.toEqual({
      accountType: "organization",
      tenantId: "tenant-1",
      userId: "user-1",
    })
  })

  it("trata tipo desconhecido como member", async () => {
    cookieState.value = "linkedin:outro:tenant-1:user-1:state-1"

    await expect(readOAuthState("linkedin", "state-1")).resolves.toMatchObject({
      accountType: "member",
    })
  })

  it("recusa provider, state ou cookie divergente", async () => {
    cookieState.value = "linkedin:member:tenant-1:user-1:state-1"

    await expect(readOAuthState("instagram", "state-1")).resolves.toBeNull()
    await expect(readOAuthState("linkedin", "state-2")).resolves.toBeNull()

    cookieState.value = ""
    await expect(readOAuthState("linkedin", "state-1")).resolves.toBeNull()
  })

  it("usa cookie httpOnly de curta duração", () => {
    expect(oauthCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
      secure: false,
    })
  })
})
