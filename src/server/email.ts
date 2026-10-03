import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import { EMAIL_TEMPLATES, renderTemplate } from "@/lib/email-templates"

export async function sendTenantEmail(
  supabase: SupabaseClient,
  params: {
    tenantId: string
    templateKey: string
    to: string
    vars: Record<string, string>
  },
): Promise<{ sent: boolean }> {
  const { tenantId, templateKey, to, vars } = params

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
  const html = renderTemplate(custom?.body ?? fallback?.body ?? "", vars)

  const result = await sendEmail({ to, subject, html })
  const status = result.sent ? "sent" : result.skipped ? "skipped" : "error"

  await supabase.from("email_log").insert({
    tenant_id: tenantId,
    to_email: to,
    subject,
    template_key: templateKey,
    status,
    error: result.error ?? null,
  })

  return { sent: result.sent }
}
