import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { socialNativeEnabled } from "@/lib/env"
import { logger } from "@/lib/logger"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/database.types"
import { getSocialProvider } from "@/server/social"
import { socialPublishNextAttemptAt } from "@/server/social/backoff"
import {
  SocialProviderError,
  type SocialAccountType,
  type SocialPublishMedia,
} from "@/server/social/provider"
import { getValidTokens } from "@/server/social/tokens"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_RETRIES = 4

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 1000)
}

async function recordEvent(
  tenantId: string,
  postId: string,
  event: string,
  metadata: Json,
) {
  const admin = createAdminClient()
  await admin.from("social_post_events").insert({
    tenant_id: tenantId,
    post_id: postId,
    event,
    actor_id: null,
    metadata,
  })
}

async function syncPostStatus(postId: string, tenantId: string) {
  const admin = createAdminClient()
  const { data: targets } = await admin
    .from("social_post_targets")
    .select("status, error")
    .eq("post_id", postId)
    .eq("tenant_id", tenantId)

  const rows = targets ?? []
  if (rows.length === 0) return

  const published = rows.filter((row) => row.status === "published").length
  const failed = rows.filter((row) => row.status === "failed").length
  const active = rows.filter(
    (row) => row.status === "pending" || row.status === "publishing",
  ).length

  let status: string | null = null
  let failureReason: string | null = null

  if (active > 0) {
    status = "publishing"
  } else if (published === rows.length) {
    status = "published"
  } else if (published > 0) {
    status = "partially_published"
    failureReason =
      rows.find((row) => row.status === "failed")?.error ??
      "Algumas redes não foram publicadas."
  } else if (failed === rows.length) {
    status = "failed"
    failureReason =
      rows.find((row) => row.error)?.error ?? "Falha na publicação."
  }

  if (!status) return

  const values: {
    status: string
    published_at?: string | null
    failure_reason?: string | null
  } = { status }

  if (status === "published") {
    values.published_at = new Date().toISOString()
    values.failure_reason = null
  } else if (status === "failed" || status === "partially_published") {
    values.failure_reason = failureReason
  }

  await admin
    .from("social_posts")
    .update(values)
    .eq("id", postId)
    .eq("tenant_id", tenantId)
}

async function syncStalePublishingPosts() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from("social_posts")
    .select("id, tenant_id")
    .eq("status", "publishing")
    .is("deleted_at", null)
    .limit(25)

  const rows = posts ?? []
  if (rows.length === 0) return

  const { data: targets } = await admin
    .from("social_post_targets")
    .select("post_id, status")
    .in(
      "post_id",
      rows.map((post) => post.id),
    )

  const active = new Set(
    (targets ?? [])
      .filter(
        (target) =>
          target.status === "pending" || target.status === "publishing",
      )
      .map((target) => target.post_id),
  )

  for (const post of rows) {
    if (!active.has(post.id)) {
      await syncPostStatus(post.id, post.tenant_id)
    }
  }
}

async function processTarget(input: {
  targetId: string
  tenantId: string
  postId: string
  accountId: string
}): Promise<"published" | "failed" | "retrying"> {
  const admin = createAdminClient()
  const { data: target } = await admin
    .from("social_post_targets")
    .select("id, attempts, metadata")
    .eq("id", input.targetId)
    .maybeSingle()
  const { data: post } = await admin
    .from("social_posts")
    .select("id, content, status")
    .eq("id", input.postId)
    .eq("tenant_id", input.tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  const { data: account } = await admin
    .from("social_accounts")
    .select(
      "id, provider, provider_account_id, display_name, avatar_url, account_type, metadata, status",
    )
    .eq("id", input.accountId)
    .eq("tenant_id", input.tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  const { data: mediaRows } = await admin
    .from("social_media")
    .select("storage_path, file_name, mime_type")
    .eq("post_id", input.postId)
    .eq("tenant_id", input.tenantId)
    .order("created_at", { ascending: true })

  const attempts = target?.attempts ?? 0

  if (!target || !post || !account) {
    await admin
      .from("social_post_targets")
      .update({
        status: "failed",
        error: "Post ou conta não encontrados.",
        locked_at: null,
        next_attempt_at: null,
      })
      .eq("id", input.targetId)
    return "failed"
  }

  if (!["scheduled", "publishing"].includes(post.status)) {
    await admin
      .from("social_post_targets")
      .update({
        status: "failed",
        error: "O post não está mais agendado.",
        locked_at: null,
        next_attempt_at: null,
      })
      .eq("id", input.targetId)
    return "failed"
  }

  const provider = getSocialProvider(account.provider)
  if (!provider || !provider.isConfigured) {
    await admin
      .from("social_post_targets")
      .update({
        status: "failed",
        error: "Provedor de publicação não configurado.",
        locked_at: null,
        next_attempt_at: null,
        attempts: attempts + 1,
      })
      .eq("id", input.targetId)
    await recordEvent(input.tenantId, input.postId, "failed", {
      provider: account.provider,
      reason: "provider_not_configured",
    })
    return "failed"
  }

  if (account.status !== 1) {
    await admin
      .from("social_post_targets")
      .update({
        status: "failed",
        error: "Conta social desconectada.",
        locked_at: null,
        next_attempt_at: null,
        attempts: attempts + 1,
      })
      .eq("id", input.targetId)
    await recordEvent(input.tenantId, input.postId, "failed", {
      provider: account.provider,
      reason: "account_disconnected",
    })
    return "failed"
  }

  try {
    const tokens = await getValidTokens(account.id, provider)
    const paths = (mediaRows ?? []).map((row) => row.storage_path)
    const media: SocialPublishMedia[] = []

    if (paths.length > 0) {
      const { data: signed } = await admin.storage
        .from("social_media")
        .createSignedUrls(paths, 60 * 60 * 24)
      const urlByPath = new Map<string, string>()
      for (const entry of signed ?? []) {
        if (entry.path && entry.signedUrl) {
          urlByPath.set(entry.path, entry.signedUrl)
        }
      }
      for (const row of mediaRows ?? []) {
        const url = urlByPath.get(row.storage_path)
        if (url) {
          media.push({
            url,
            fileName: row.file_name,
            mimeType: row.mime_type,
          })
        }
      }
    }

    if (account.provider === "instagram" && media.length === 0) {
      await admin
        .from("social_post_targets")
        .update({
          status: "failed",
          error: "O Instagram exige uma imagem para publicar.",
          locked_at: null,
          next_attempt_at: null,
          attempts: attempts + 1,
        })
        .eq("id", input.targetId)
      await recordEvent(input.tenantId, input.postId, "failed", {
        mode: "native",
        provider: account.provider,
        reason: "missing_media",
      })
      return "failed"
    }

    const result = await provider.publish({
      content: post.content,
      media,
      profile: {
        id: account.provider_account_id,
        name: account.display_name,
        avatarUrl: account.avatar_url,
        accountType: account.account_type as SocialAccountType,
        metadata:
          account.metadata && typeof account.metadata === "object"
            ? (account.metadata as Record<string, unknown>)
            : {},
      },
      tokens,
    })

    const currentMetadata =
      target.metadata && typeof target.metadata === "object"
        ? (target.metadata as Record<string, unknown>)
        : {}

    await admin
      .from("social_post_targets")
      .update({
        status: "published",
        external_post_id: result.externalId,
        published_at: new Date().toISOString(),
        error: null,
        locked_at: null,
        next_attempt_at: null,
        metadata: {
          ...currentMetadata,
          ...(result.metadata ?? {}),
        } as Json,
      })
      .eq("id", input.targetId)

    await recordEvent(input.tenantId, input.postId, "published", {
      mode: "native",
      provider: account.provider,
      external_id: result.externalId,
    })
    return "published"
  } catch (error) {
    const message = errorText(error)
    const nextAttempts = attempts + 1
    const status = error instanceof SocialProviderError ? error.status : null
    const nonRetryable =
      status !== null && status >= 400 && status < 500 && status !== 429
    const final = nonRetryable || nextAttempts >= MAX_RETRIES

    await admin
      .from("social_post_targets")
      .update({
        status: final ? "failed" : "pending",
        attempts: nextAttempts,
        error: message,
        locked_at: null,
        next_attempt_at: final
          ? null
          : socialPublishNextAttemptAt(nextAttempts),
      })
      .eq("id", input.targetId)

    await recordEvent(
      input.tenantId,
      input.postId,
      final ? "failed" : "retried",
      {
        mode: "native",
        provider: account.provider,
        attempt: nextAttempts,
        error: message,
      },
    )
    return final ? "failed" : "retrying"
  }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error("social.publish.missing_secret")
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 })
  }

  const auth = request.headers.get("authorization") ?? ""
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    logger.warn("social.publish.unauthorized")
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!socialNativeEnabled()) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const admin = createAdminClient()
  const { error: resetError } = await admin.rpc("reset_stale_social_targets", {
    p_minutes: 10,
  })
  if (resetError) {
    logger.error("social.publish.reset_failed", { error: resetError.message })
  }

  const batchSize = Number(process.env.SOCIAL_PUBLISH_BATCH_SIZE ?? 5)
  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_social_publish_targets",
    { p_limit: Number.isFinite(batchSize) ? batchSize : 5 },
  )
  if (claimError) {
    logger.error("social.publish.claim_failed", { error: claimError.message })
    return NextResponse.json({ error: "claim_failed" }, { status: 500 })
  }

  const targets = claimed ?? []
  const results = { processed: 0, published: 0, failed: 0, retried: 0 }

  for (const target of targets) {
    const outcome = await processTarget({
      targetId: target.target_id,
      tenantId: target.tenant_id,
      postId: target.post_id,
      accountId: target.account_id,
    })
    results.processed += 1
    if (outcome === "published") results.published += 1
    if (outcome === "failed") results.failed += 1
    if (outcome === "retrying") results.retried += 1
    await syncPostStatus(target.post_id, target.tenant_id)
  }

  await syncStalePublishingPosts()

  logger.info("social.publish", results)
  return NextResponse.json({ ok: true, ...results })
}
