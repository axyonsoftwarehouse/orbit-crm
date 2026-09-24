import { createClient } from "@/lib/supabase/server"

export type CommentRow = {
  id: string
  content: string
  created_at: string
  author_id: string | null
  author_name: string | null
}

export async function listComments(
  tenantId: string,
  entityType: string,
  entityId: string,
): Promise<CommentRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true })

  const rows = (data ?? []) as {
    id: string
    content: string
    created_at: string
    author_id: string | null
  }[]

  const ids = Array.from(
    new Set(rows.map((row) => row.author_id).filter(Boolean) as string[]),
  )
  const names = new Map<string, string | null>()
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
    for (const profile of (profiles ?? []) as {
      id: string
      full_name: string | null
    }[]) {
      names.set(profile.id, profile.full_name)
    }
  }

  return rows.map((row) => ({
    ...row,
    author_name: row.author_id ? (names.get(row.author_id) ?? null) : null,
  }))
}
