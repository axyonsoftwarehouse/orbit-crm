import { createClient } from "@/lib/supabase/server"

export type ActivityRow = {
  id: string
  entity: string
  entity_id: string | null
  action: string
  created_at: string
  actor: { full_name: string | null } | null
}

export async function listActivityPage(
  tenantId: string,
  options: { page: number; pageSize: number; entity?: string },
): Promise<{ rows: ActivityRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("activity_log")
    .select(
      "id, entity, entity_id, action, created_at, actor:profiles(full_name)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)

  if (options.entity) query = query.eq("entity", options.entity)

  const from = (options.page - 1) * options.pageSize
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  return {
    rows: (data ?? []) as unknown as ActivityRow[],
    total: count ?? 0,
  }
}
