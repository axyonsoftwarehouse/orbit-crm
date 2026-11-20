import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"
import { isNativeSocialProvider } from "@/server/social"
import { resolveSocialRecipients } from "@/server/social/recipients"
import { formatDateTime } from "@/lib/format"

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000"

function excerpt(content: string, length = 90) {
  const value = content.replace(/\s+/g, " ").trim()
  return value.length > length ? `${value.slice(0, length)}…` : value
}

export type SocialReminderTarget = {
  provider: string
  accountActive: boolean
}

/**
 * O lembrete manual só faz sentido quando algum destino não será publicado
 * automaticamente pelo worker: tenant em modo `manual`, rede sem integração
 * nativa ou conta desconectada/excluída.
 */
export function needsManualPublishReminder(
  targets: SocialReminderTarget[],
  publishMode: string,
): boolean {
  if (targets.length === 0) return true
  if (publishMode !== "provider") return true
  return targets.some(
    (target) =>
      !target.accountActive || !isNativeSocialProvider(target.provider),
  )
}

async function markReminderSent(
  admin: ReturnType<typeof createAdminClient>,
  postId: string,
  tenantId: string,
) {
  await admin
    .from("social_posts")
    .update({ manual_reminder_sent_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
}

export type SocialReminderResult = {
  posts: number
  notifications: number
  emails: number
}

export async function runSocialPublishReminders(): Promise<SocialReminderResult> {
  try {
    const admin = createAdminClient()
    const in24h = new Date(Date.now() + 86_400_000).toISOString()

    const { data: posts } = await admin
      .from("social_posts")
      .select("id, tenant_id, content, scheduled_at, created_by")
      .eq("status", "scheduled")
      .is("deleted_at", null)
      .is("manual_reminder_sent_at", null)
      .lte("scheduled_at", in24h)
      .order("scheduled_at", { ascending: true })
      .limit(50)

    const postRows = posts ?? []
    const postIds = postRows.map((post) => post.id)
    const tenantIds = [...new Set(postRows.map((post) => post.tenant_id))]

    const [{ data: targetRows }, { data: settingRows }] =
      postIds.length > 0
        ? await Promise.all([
            admin
              .from("social_post_targets")
              .select("post_id, account_id")
              .in("post_id", postIds),
            admin
              .from("social_settings")
              .select("tenant_id, publish_mode")
              .in("tenant_id", tenantIds),
          ])
        : [{ data: [] }, { data: [] }]

    const accountIds = [
      ...new Set(
        ((targetRows ?? []) as { account_id: string }[]).map(
          (target) => target.account_id,
        ),
      ),
    ]
    const { data: accountRows } =
      accountIds.length > 0
        ? await admin
            .from("social_accounts")
            .select("id, provider, status, deleted_at")
            .in("id", accountIds)
        : { data: [] }

    const accountMap = new Map(
      (
        (accountRows ?? []) as {
          id: string
          provider: string
          status: number
          deleted_at: string | null
        }[]
      ).map((account) => [account.id, account]),
    )

    const targetsByPost = new Map<string, SocialReminderTarget[]>()
    for (const target of (targetRows ?? []) as {
      post_id: string
      account_id: string
    }[]) {
      const account = accountMap.get(target.account_id)
      const list = targetsByPost.get(target.post_id) ?? []
      list.push({
        provider: account?.provider ?? "",
        accountActive: Boolean(
          account && account.status === 1 && !account.deleted_at,
        ),
      })
      targetsByPost.set(target.post_id, list)
    }

    const publishModeByTenant = new Map(
      (
        (settingRows ?? []) as { tenant_id: string; publish_mode: string }[]
      ).map((setting) => [setting.tenant_id, setting.publish_mode]),
    )

    let notifications = 0
    let emails = 0

    for (const post of postRows) {
      const publishMode = publishModeByTenant.get(post.tenant_id) ?? "manual"
      if (
        !needsManualPublishReminder(
          targetsByPost.get(post.id) ?? [],
          publishMode,
        )
      ) {
        await markReminderSent(admin, post.id, post.tenant_id)
        continue
      }

      const recipients = await resolveSocialRecipients(
        admin,
        post.tenant_id,
        post.created_by,
      )

      const summary = excerpt(post.content)
      const scheduled = post.scheduled_at
        ? formatDateTime(post.scheduled_at)
        : "sem data"

      for (const userId of recipients) {
        await createNotification(admin, {
          tenantId: post.tenant_id,
          userId,
          type: "social_publish_due",
          title: `Post para publicar: ${summary}`,
          body: `Agendado para ${scheduled}. Publicação manual.`,
          url: `/app/social/${post.id}`,
        })
        notifications++

        const { data: profile } = await admin
          .from("profiles")
          .select("email, notify_email")
          .eq("id", userId)
          .maybeSingle()

        if (profile?.email && profile.notify_email) {
          const result = await sendTenantEmail(admin, {
            tenantId: post.tenant_id,
            templateKey: "social_publish_due",
            to: profile.email,
            vars: {
              post: summary,
              scheduled_at: scheduled,
              url: `${APP_URL}/app/social/${post.id}`,
            },
          })
          if (result.sent) emails++
        }
      }

      await markReminderSent(admin, post.id, post.tenant_id)
    }

    return { posts: postRows.length, notifications, emails }
  } catch (error) {
    logger.error("social.reminders_failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { posts: 0, notifications: 0, emails: 0 }
  }
}
