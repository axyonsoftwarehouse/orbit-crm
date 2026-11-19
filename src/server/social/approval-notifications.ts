import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"

/**
 * Avisos do fluxo de aprovação do Social. Usam o client admin porque avisam
 * outras pessoas (a policy de `notifications` só deixa criar para si mesmo, e
 * o portal não lê `memberships`/`profiles` da equipe). São best-effort: uma
 * falha é logada e nunca desfaz a transição do post.
 */

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  )
}

function excerpt(content: string, length = 80) {
  const value = content.replace(/\s+/g, " ").trim()
  return value.length > length ? `${value.slice(0, length)}…` : value
}

type PostRow = {
  id: string
  tenant_id: string
  company_id: string
  content: string
  created_by: string | null
}

export async function notifyPortalApprovalRequested(input: {
  tenantId: string
  postId: string
}): Promise<{ emails: number }> {
  let emails = 0
  try {
    const admin = createAdminClient()
    const { data: post } = await admin
      .from("social_posts")
      .select("id, tenant_id, company_id, content, created_by")
      .eq("id", input.postId)
      .eq("tenant_id", input.tenantId)
      .maybeSingle()
    if (!post) return { emails }
    const row = post as PostRow

    const [{ data: company }, { data: contacts }] = await Promise.all([
      admin
        .from("companies")
        .select("name")
        .eq("id", row.company_id)
        .eq("tenant_id", row.tenant_id)
        .maybeSingle(),
      admin
        .from("contacts")
        .select("email")
        .eq("tenant_id", row.tenant_id)
        .eq("company_id", row.company_id)
        .not("user_id", "is", null)
        .is("deleted_at", null),
    ])

    const vars = {
      post: excerpt(row.content),
      company: (company as { name?: string } | null)?.name ?? "",
      url: `${appUrl()}/portal/social/${row.id}`,
    }

    for (const contact of (contacts ?? []) as { email: string | null }[]) {
      if (!contact.email) continue
      const result = await sendTenantEmail(admin, {
        tenantId: row.tenant_id,
        templateKey: "social_approval_requested",
        to: contact.email,
        vars,
      })
      if (result.sent) emails++
    }
  } catch (error) {
    logger.error("social.approval_requested_notify_failed", {
      postId: input.postId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return { emails }
}

export async function notifyStaffPortalResponse(input: {
  postId: string
  companyId: string
  approved: boolean
  note?: string | null
}): Promise<{ notifications: number; emails: number }> {
  let notifications = 0
  let emails = 0
  try {
    const admin = createAdminClient()
    const { data: post } = await admin
      .from("social_posts")
      .select("id, tenant_id, company_id, content, created_by")
      .eq("id", input.postId)
      .eq("company_id", input.companyId)
      .maybeSingle()
    if (!post) return { notifications, emails }
    const row = post as PostRow

    // O autor só é avisado se ainda for membro ativo do tenant; quem saiu não
    // deve receber trecho do post nem a nota do cliente.
    let authorActive = false
    if (row.created_by) {
      const { data: membership } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", row.tenant_id)
        .eq("user_id", row.created_by)
        .eq("status", "active")
        .maybeSingle()
      authorActive = Boolean(membership)
    }

    let recipients: string[] = []
    if (row.created_by && authorActive) {
      recipients = [row.created_by]
    } else {
      const { data: admins } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", row.tenant_id)
        .eq("status", "active")
        .in("role", ["owner", "admin"])
      recipients = ((admins ?? []) as { user_id: string }[]).map(
        (item) => item.user_id,
      )
    }

    const summary = excerpt(row.content)
    const decision = input.approved ? "aprovou" : "rejeitou"
    const note = input.note?.trim() ?? ""
    const path = `/app/social/${row.id}`

    for (const userId of recipients) {
      await createNotification(admin, {
        tenantId: row.tenant_id,
        userId,
        type: "social_approval_response",
        title: input.approved
          ? `Cliente aprovou o post: ${summary}`
          : `Cliente rejeitou o post: ${summary}`,
        body: note || null,
        url: path,
      })
      notifications++

      const { data: profile } = await admin
        .from("profiles")
        .select("email, notify_email")
        .eq("id", userId)
        .maybeSingle()
      const prefs = profile as {
        email: string | null
        notify_email: boolean
      } | null

      if (prefs?.email && prefs.notify_email) {
        const result = await sendTenantEmail(admin, {
          tenantId: row.tenant_id,
          templateKey: "social_approval_response",
          to: prefs.email,
          vars: { post: summary, decision, note, url: `${appUrl()}${path}` },
        })
        if (result.sent) emails++
      }
    }
  } catch (error) {
    logger.error("social.approval_response_notify_failed", {
      postId: input.postId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return { notifications, emails }
}
