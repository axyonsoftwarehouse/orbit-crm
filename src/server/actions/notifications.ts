"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import {
  listNotifications,
  unreadCount,
  type NotificationRow,
} from "@/server/queries/notifications"

/**
 * Leitura do sino pelo servidor. Substitui a assinatura Realtime feita no
 * navegador, que não tem sessão (cookies httpOnly); o sino chama esta action
 * periodicamente e ao voltar para a aba.
 */
export async function getNotificationsAction(): Promise<{
  notifications: NotificationRow[]
  unread: number
}> {
  const user = await getUser()
  const active = user ? await getActiveMembership() : null
  if (!user || !active) return { notifications: [], unread: 0 }

  const [notifications, unread] = await Promise.all([
    listNotifications(active.tenantId, user.id),
    unreadCount(active.tenantId, user.id),
  ])
  return { notifications, unread }
}

export async function markNotificationReadAction(input: { id: string }) {
  const user = await getUser()
  if (!user || !input.id) return

  const supabase = await createClient()
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", user.id)

  revalidatePath("/app", "layout")
}

export async function markAllNotificationsReadAction() {
  const user = await getUser()
  if (!user) return

  const supabase = await createClient()
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)

  revalidatePath("/app", "layout")
}
