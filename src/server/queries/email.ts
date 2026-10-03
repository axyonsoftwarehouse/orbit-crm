import { createClient } from "@/lib/supabase/server"

export type EmailTemplateRow = {
  key: string
  subject: string
  body: string
}

export type EmailLogRow = {
  id: string
  to_email: string
  subject: string
  template_key: string | null
  status: string
  error: string | null
  created_at: string
}

export async function listEmailTemplates(
  tenantId: string,
): Promise<Record<string, EmailTemplateRow>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("email_templates")
    .select("key, subject, body")
    .eq("tenant_id", tenantId)

  const map: Record<string, EmailTemplateRow> = {}
  for (const row of (data ?? []) as EmailTemplateRow[]) {
    map[row.key] = row
  }
  return map
}

export async function listEmailLog(
  tenantId: string,
  limit = 20,
): Promise<EmailLogRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("email_log")
    .select("id, to_email, subject, template_key, status, error, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as EmailLogRow[]
}
