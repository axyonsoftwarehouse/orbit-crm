import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail, type EmailAttachment } from "@/lib/email"
import {
  EMAIL_TEMPLATES,
  escapeHtml,
  renderTemplate,
} from "@/lib/email-templates"

export async function sendTenantEmail(
  supabase: SupabaseClient,
  params: {
    tenantId: string
    templateKey: string
    to: string
    vars: Record<string, string>
    attachments?: EmailAttachment[]
  },
): Promise<{ sent: boolean; skipped?: boolean }> {
  const { tenantId, templateKey, to, vars, attachments } = params

  const { data: custom } = await supabase
    .from("email_templates")
    .select("subject, body")
    .eq("tenant_id", tenantId)
    .eq("key", templateKey)
    .maybeSingle()

  const fallback = EMAIL_TEMPLATES[templateKey]
  const subject = renderTemplate(
    custom?.subject ?? fallback?.subject ?? "",
    vars,
  )
  const htmlVars = Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [key, escapeHtml(value)]),
  )
  const html = renderTemplate(custom?.body ?? fallback?.body ?? "", htmlVars)

  const result = await sendEmail({ to, subject, html, attachments })
  const status = result.sent ? "sent" : result.skipped ? "skipped" : "error"

  await supabase.from("email_log").insert({
    tenant_id: tenantId,
    to_email: to,
    subject,
    template_key: templateKey,
    status,
    error: result.error ?? null,
  })

  return { sent: result.sent, skipped: result.skipped }
}
