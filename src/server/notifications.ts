import type { SupabaseClient } from "@supabase/supabase-js"

export type CreateNotificationInput = {
  tenantId: string
  userId: string
  title: string
  body?: string | null
  url?: string | null
  type?: string
}

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
) {
  await supabase.from("notifications").insert({
    tenant_id: input.tenantId,
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    url: input.url ?? null,
    type: input.type ?? "info",
  })
}
