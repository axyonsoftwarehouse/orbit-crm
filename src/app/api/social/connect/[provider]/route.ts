import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { socialNativeEnabled } from "@/lib/env"
import { getActiveMembership } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { getSocialProvider } from "@/server/social"
import {
  COOKIE_NAME,
  createOAuthState,
  getOAuthRedirectUri,
  oauthCookieOptions,
} from "@/server/social/oauth"
import type { SocialAccountType } from "@/server/social/provider"

export const dynamic = "force-dynamic"

function errorRedirect(request: Request, code: string) {
  return NextResponse.redirect(
    new URL(`/app/social/contas?error=${code}`, request.url),
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params
  const active = await getActiveMembership()
  if (!active) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (!isManager(active.role)) return errorRedirect(request, "permission")
  if (!socialNativeEnabled()) return errorRedirect(request, "disabled")

  const provider = getSocialProvider(providerId)
  if (!provider) return errorRedirect(request, "provider")
  if (!provider.isConfigured) return errorRedirect(request, "not_configured")

  const url = new URL(request.url)
  const requestedType = url.searchParams.get("type")
  const accountType: SocialAccountType =
    providerId === "instagram"
      ? "instagram"
      : requestedType === "organization"
        ? "organization"
        : "member"

  if (!provider.supportsAccountType(accountType)) {
    return errorRedirect(request, "account_type")
  }

  const redirectUri = getOAuthRedirectUri(providerId)
  const { state, cookie } = await createOAuthState(
    providerId,
    accountType,
    active.tenantId,
    user.id,
  )
  const authUrl = provider.getAuthUrl({ redirectUri, state, accountType })
  const response = NextResponse.redirect(authUrl)
  response.cookies.set(COOKIE_NAME, cookie, oauthCookieOptions())
  return response
}
