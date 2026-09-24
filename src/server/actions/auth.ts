"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signInSchema } from "@/lib/validations/auth"

export type AuthState = { error?: string } | undefined

export async function signInAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Informe um e-mail e senha válidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: "Credenciais inválidas." }
  }

  redirect("/app")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
