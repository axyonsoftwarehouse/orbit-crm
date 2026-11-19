import type { SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"

export type CreateNotificationInput = {
  tenantId: string
  userId: string
  title: string
  body?: string | null
  url?: string | null
  type?: string
}

/** Cria a notificação; devolve `false` (e loga) se o insert falhar. */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<boolean> {
  const { error } = await supabase.from("notifications").insert({
    tenant_id: input.tenantId,
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    url: input.url ?? null,
    type: input.type ?? "info",
  })

  if (error) {
    logger.error("notifications.insert_failed", {
      type: input.type ?? "info",
      error: error.message,
    })
    return false
  }
  return true
}
