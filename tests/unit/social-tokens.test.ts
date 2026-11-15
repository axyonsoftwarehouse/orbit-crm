import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OAuthTokenSet, SocialProvider } from "@/server/social/provider"

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}))

import {
  clearSocialTokens,
  getSocialTokens,
  getValidTokens,
  storeSocialTokens,
} from "@/server/social/tokens"

const tokens: OAuthTokenSet = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  scopes: [],
}

function provider(
  id: "instagram" | "linkedin",
  refreshTokens: SocialProvider["refreshTokens"],
): SocialProvider {
  return {
    id,
    label: id,
    isConfigured: true,
    supportsAccountType: () => true,
    getAuthUrl: () => "",
    exchangeCode: vi.fn(),
    refreshTokens,
    publish: vi.fn(),
  }
}

beforeEach(() => {
  rpcMock.mockReset()
})

describe("tokens no Vault", () => {
  it("grava os tokens pela RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    await storeSocialTokens("account-1", tokens)

    expect(rpcMock).toHaveBeenCalledWith("social_store_tokens", {
      p_account: "account-1",
      p_access_token: "access",
      p_refresh_token: "refresh",
      p_expires_at: tokens.expiresAt,
    })
  })

  it("lê os tokens e devolve null quando não há access token", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          access_token: "access",
          refresh_token: "refresh",
          expires_at: tokens.expiresAt,
        },
      ],
      error: null,
    })
    await expect(getSocialTokens("account-1")).resolves.toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: tokens.expiresAt,
    })

    rpcMock.mockResolvedValueOnce({ data: [], error: null })
    await expect(getSocialTokens("account-1")).resolves.toBeNull()
  })

  it("propaga o erro da RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "falhou" } })

    await expect(clearSocialTokens("account-1")).rejects.toThrow("falhou")
  })
})

describe("getValidTokens", () => {
  it("falha quando a conta não tem token", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    await expect(
      getValidTokens("account-1", provider("linkedin", vi.fn())),
    ).rejects.toThrow("Conta sem token de acesso")
  })

  it("não renova quando o token ainda vale", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          access_token: "access",
          refresh_token: "refresh",
          expires_at: tokens.expiresAt,
        },
      ],
      error: null,
    })
    const refresh = vi.fn()

    const result = await getValidTokens(
      "account-1",
      provider("linkedin", refresh),
    )

    expect(result.accessToken).toBe("access")
    expect(refresh).not.toHaveBeenCalled()
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })

  it("renova e regrava quando o token está perto de expirar", async () => {
    const soon = new Date(Date.now() + 60 * 1000).toISOString()
    const refreshed: OAuthTokenSet = {
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: [],
    }
    rpcMock.mockImplementation((fn: string) => {
      if (fn === "social_get_tokens") {
        return {
          data: [
            {
              access_token: "access",
              refresh_token: "refresh",
              expires_at: soon,
            },
          ],
          error: null,
        }
      }
      return { data: null, error: null }
    })
    const refresh = vi.fn().mockResolvedValue(refreshed)

    const result = await getValidTokens(
      "account-1",
      provider("linkedin", refresh),
    )

    expect(result.accessToken).toBe("new-access")
    expect(refresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "access" }),
    )
    expect(rpcMock).toHaveBeenCalledWith("social_store_tokens", {
      p_account: "account-1",
      p_access_token: "new-access",
      p_refresh_token: "new-refresh",
      p_expires_at: refreshed.expiresAt,
    })
  })

  it("tenta renovar o Instagram mesmo sem refresh token", async () => {
    const soon = new Date(Date.now() + 60 * 1000).toISOString()
    const refreshed: OAuthTokenSet = {
      accessToken: "ig-new",
      refreshToken: null,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: [],
    }
    rpcMock.mockImplementation((fn: string) => {
      if (fn === "social_get_tokens") {
        return {
          data: [
            { access_token: "ig-old", refresh_token: null, expires_at: soon },
          ],
          error: null,
        }
      }
      return { data: null, error: null }
    })
    const refresh = vi.fn().mockResolvedValue(refreshed)

    const result = await getValidTokens(
      "account-1",
      provider("instagram", refresh),
    )

    expect(refresh).toHaveBeenCalled()
    expect(result.accessToken).toBe("ig-new")
  })

  it("mantém o token atual quando a renovação falha", async () => {
    const soon = new Date(Date.now() + 60 * 1000).toISOString()
    rpcMock.mockResolvedValue({
      data: [
        {
          access_token: "access",
          refresh_token: "refresh",
          expires_at: soon,
        },
      ],
      error: null,
    })
    const refresh = vi.fn().mockRejectedValue(new Error("sem rede"))

    const result = await getValidTokens(
      "account-1",
      provider("linkedin", refresh),
    )

    expect(result.accessToken).toBe("access")
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })
})
