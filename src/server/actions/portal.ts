"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signInSchema } from "@/lib/validations/auth"

export type PortalAuthState = { error?: string } | undefined

export async function portalSignInAction(
  _prevState: PortalAuthState,
  formData: FormData,
): Promise<PortalAuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Informe um e-mail e senha válidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return { error: "Credenciais inválidas." }

  redirect("/portal")
}

export async function portalSignOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/portal/login")
}

export async function respondEstimateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const accept = String(formData.get("accept") ?? "") === "1"
  if (!id) return

  const supabase = await createClient()
  const { error } = await supabase.rpc("client_respond_estimate", {
    p_estimate: id,
    p_accept: accept,
  })
  if (error) return

  revalidatePath("/portal/orcamentos")
  revalidatePath(`/portal/orcamentos/${id}`)
}
