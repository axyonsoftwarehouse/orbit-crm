import { createAdminClient } from "@/lib/supabase/admin"
import type { OAuthTokenSet, SocialProvider } from "@/server/social/provider"

export async function storeSocialTokens(
  accountId: string,
  tokens: OAuthTokenSet,
): Promise<void> {
  const admin = createAdminClient()
  // O typegen marca os argumentos como não-nulos, mas a função SQL trata
  // `null` (sem refresh token / sem validade) — o valor real pode ser null.
  const { error } = await admin.rpc("social_store_tokens", {
    p_account: accountId,
    p_access_token: tokens.accessToken,
    p_refresh_token: (tokens.refreshToken ?? null) as unknown as string,
    p_expires_at: (tokens.expiresAt ?? null) as unknown as string,
  })
  if (error) throw new Error(error.message)
}

export async function getSocialTokens(
  accountId: string,
): Promise<OAuthTokenSet | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("social_get_tokens", {
    p_account: accountId,
  })
  if (error) throw new Error(error.message)
  const row = (data ?? [])[0]
  if (!row?.access_token) return null

  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scopes: [],
  }
}

export async function clearSocialTokens(accountId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("social_clear_tokens", {
    p_account: accountId,
  })
  if (error) throw new Error(error.message)
}

export async function getValidTokens(
  accountId: string,
  provider: SocialProvider,
): Promise<OAuthTokenSet> {
  const tokens = await getSocialTokens(accountId)
  if (!tokens) {
    throw new Error("Conta sem token de acesso; reconecte a conta.")
  }

  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0
  const expiringSoon = expiresAt > 0 && expiresAt - Date.now() < 5 * 60 * 1000
  const canRefresh = provider.id === "instagram" || Boolean(tokens.refreshToken)

  if (!expiringSoon || !canRefresh) return tokens

  try {
    const refreshed = await provider.refreshTokens(tokens)
    await storeSocialTokens(accountId, refreshed)
    return refreshed
  } catch {
    return tokens
  }
}
