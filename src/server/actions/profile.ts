"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"

export type NotificationPrefsState =
  { error?: string; success?: string } | undefined

export async function updateNotificationPrefsAction(
  _prevState: NotificationPrefsState,
  formData: FormData,
): Promise<NotificationPrefsState> {
  const user = await getUser()
  if (!user) return { error: "Não autenticado." }

  const notifyEmail = formData.get("notify_email") === "on"

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ notify_email: notifyEmail })
    .eq("id", user.id)

  if (error) return dbError("profile", error)

  revalidatePath("/app/configuracoes")
  return { success: "Preferências atualizadas." }
}
