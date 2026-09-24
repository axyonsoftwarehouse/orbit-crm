"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"

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
