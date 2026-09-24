import { createClient } from "@/lib/supabase/server"

export type AttachmentRow = {
  id: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  storage_path: string
  created_at: string
  url: string | null
}

export async function listAttachments(
  tenantId: string,
  entityType: string,
  entityId: string,
): Promise<AttachmentRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("attachments")
    .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as Omit<AttachmentRow, "url">[]
  if (rows.length === 0) return []

  const { data: signed } = await supabase.storage
    .from("attachments")
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      3600,
    )

  const urlByPath = new Map<string, string>()
  for (const entry of (signed ?? []) as {
    path: string | null
    signedUrl: string
  }[]) {
    if (entry.path && entry.signedUrl)
      urlByPath.set(entry.path, entry.signedUrl)
  }

  return rows.map((row) => ({
    ...row,
    url: urlByPath.get(row.storage_path) ?? null,
  }))
}
