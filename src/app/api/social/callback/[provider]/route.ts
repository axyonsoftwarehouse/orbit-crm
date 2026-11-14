import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { socialNativeEnabled } from "@/lib/env"
import { logger } from "@/lib/logger"
import { getActiveMembership } from "@/lib/tenant"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkPlanLimitWith } from "@/server/plan-limits"
import { getSocialProvider } from "@/server/social"
import { getOAuthRedirectUri, readOAuthState } from "@/server/social/oauth"
import { storeSocialTokens } from "@/server/social/tokens"
import type { Json } from "@/lib/database.types"

export const dynamic = "force-dynamic"

function redirectToAccounts(request: Request, params: Record<string, string>) {
  const url = new URL("/app/social/contas", request.url)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const providerError = url.searchParams.get("error")

  if (providerError) {
    return redirectToAccounts(request, {
      error: "denied",
      detail: providerError,
    })
  }
  if (!socialNativeEnabled()) {
    return redirectToAccounts(request, { error: "disabled" })
  }

  const active = await getActiveMembership()
  if (!active) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const provider = getSocialProvider(providerId)
  if (!provider || !provider.isConfigured) {
    return redirectToAccounts(request, { error: "provider" })
  }
  if (!code) return redirectToAccounts(request, { error: "code" })

  const oauth = await readOAuthState(providerId, state)
  if (!oauth) return redirectToAccounts(request, { error: "state" })
  const user = await getUser()
  if (!user || oauth.tenantId !== active.tenantId || oauth.userId !== user.id) {
    return redirectToAccounts(request, { error: "state" })
  }

  try {
    const redirectUri = getOAuthRedirectUri(providerId)
    const { tokens, profile } = await provider.exchangeCode({
      code,
      redirectUri,
      accountType: oauth.accountType,
    })

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from("social_accounts")
      .select("id, metadata")
      .eq("tenant_id", active.tenantId)
      .eq("provider", providerId)
      .eq("provider_account_id", profile.id)
      .is("deleted_at", null)
      .maybeSingle()

    if (!existing) {
      const limit = await checkPlanLimitWith(
        admin,
        active.tenantId,
        "social_accounts",
      )
      if (!limit.ok) {
        return redirectToAccounts(request, { error: "plan_limit" })
      }
    }

    const currentMetadata =
      existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {}
    const metadata = {
      ...currentMetadata,
      ...profile.metadata,
    } as Json
    const now = new Date().toISOString()
    const accountValues = {
      display_name: profile.name,
      avatar_url: profile.avatarUrl,
      status: 1,
      account_type: profile.accountType,
      metadata,
      scopes: tokens.scopes,
      connected_by: user?.id ?? null,
      last_synced_at: now,
    }

    let accountId = existing?.id ?? null
    if (accountId) {
      const { error } = await admin
        .from("social_accounts")
        .update(accountValues)
        .eq("id", accountId)
        .eq("tenant_id", active.tenantId)
      if (error) throw new Error(error.message)
    } else {
      const { data: inserted, error } = await admin
        .from("social_accounts")
        .insert({
          tenant_id: active.tenantId,
          company_id: null,
          provider: providerId,
          provider_account_id: profile.id,
          ...accountValues,
        })
        .select("id")
        .single()
      if (error || !inserted) throw new Error(error?.message ?? "insert failed")
      accountId = inserted.id
    }

    await storeSocialTokens(accountId, tokens)
    const { error: settingsError } = await admin.from("social_settings").upsert(
      {
        tenant_id: active.tenantId,
        publish_mode: "provider",
      },
      { onConflict: "tenant_id" },
    )
    if (settingsError) throw new Error(settingsError.message)

    logger.info("social.oauth.connected", {
      provider: providerId,
      accountId,
      tenantId: active.tenantId,
    })
    return redirectToAccounts(request, { connected: providerId })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const detail = /Página do LinkedIn|organization/i.test(message)
      ? "linkedin_organization"
      : /developer role|tester/i.test(message)
        ? "instagram_tester"
        : undefined
    logger.error("social.oauth.failed", {
      provider: providerId,
      error: message,
    })
    return redirectToAccounts(
      request,
      detail ? { error: "oauth", detail } : { error: "oauth" },
    )
  }
}
