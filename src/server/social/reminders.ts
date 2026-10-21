import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000"

function excerpt(content: string, length = 90) {
  const value = content.replace(/\s+/g, " ").trim()
  return value.length > length ? `${value.slice(0, length)}…` : value
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

    let notifications = 0
    let emails = 0

    for (const post of posts ?? []) {
      let recipients: string[] = []
      if (post.created_by) {
        recipients = [post.created_by]
      } else {
        const { data: admins } = await admin
          .from("memberships")
          .select("user_id")
          .eq("tenant_id", post.tenant_id)
          .eq("status", "active")
          .in("role", ["owner", "admin"])
        recipients = (admins ?? []).map((row) => row.user_id)
      }

      const summary = excerpt(post.content)
      const scheduled = post.scheduled_at
        ? new Date(post.scheduled_at).toLocaleString("pt-BR")
        : "sem data"

      for (const userId of recipients) {
        await createNotification(admin, {
          tenantId: post.tenant_id,
          userId,
          type: "social_publish_due",
          title: `Post para publicar: ${summary}`,
          body: `Agendado para ${scheduled}. Modo manual.`,
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

      await admin
        .from("social_posts")
        .update({ manual_reminder_sent_at: new Date().toISOString() })
        .eq("id", post.id)
        .eq("tenant_id", post.tenant_id)
    }

    return { posts: (posts ?? []).length, notifications, emails }
  } catch (error) {
    logger.error("social.reminders_failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { posts: 0, notifications: 0, emails: 0 }
  }
}
