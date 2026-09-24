import { createClient } from "@/lib/supabase/server"

export type NotificationRow = {
  id: string
  title: string
  body: string | null
  url: string | null
  read_at: string | null
  created_at: string
}

export async function listNotifications(
  tenantId: string,
  userId: string,
  limit = 15,
): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, url, read_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as NotificationRow[]
}

export async function unreadCount(
  tenantId: string,
  userId: string,
): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("read_at", null)

  return count ?? 0
}
