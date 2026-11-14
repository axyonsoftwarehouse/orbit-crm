import { cookies } from "next/headers"
import { env } from "@/lib/env"
import type { SocialAccountType } from "@/server/social/provider"

const COOKIE_NAME = "orbit.social.oauth"

function parseAccountType(value: string): SocialAccountType {
  if (value === "organization") return "organization"
  if (value === "instagram") return "instagram"
  return "member"
}

export function getOAuthRedirectUri(provider: string): string {
  const base = (env().NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  )
  return `${base}/api/social/callback/${provider}`
}

export async function createOAuthState(
  provider: string,
  accountType: SocialAccountType,
  tenantId: string,
  userId: string,
): Promise<{ state: string; cookie: string }> {
  const state = crypto.randomUUID()
  return {
    state,
    cookie: `${provider}:${accountType}:${tenantId}:${userId}:${state}`,
  }
}

export async function readOAuthState(
  provider: string,
  state: string | null,
): Promise<{
  accountType: SocialAccountType
  tenantId: string
  userId: string
} | null> {
  if (!state) return null
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null

  const [storedProvider, storedType, storedTenant, storedUser, storedState] =
    raw.split(":")
  if (storedProvider !== provider) return null
  if (!storedState || storedState !== state) return null
  if (!storedTenant || !storedUser) return null

  return {
    accountType: parseAccountType(storedType),
    tenantId: storedTenant,
    userId: storedUser,
  }
}

export function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  }
}

export { COOKIE_NAME }
