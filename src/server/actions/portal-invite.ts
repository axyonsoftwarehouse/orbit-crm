"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { newPasswordSchema } from "@/lib/validations/auth"
import { lookupPortalInvitation } from "@/server/portal-invitations"
import { isLoginRateLimited } from "@/server/rate-limit"

export type AcceptPortalInviteState = { error?: string } | undefined

/**
 * Aceita o convite do portal: cria a conta com a senha escolhida pelo
 * cliente (ou, se o e-mail já tiver conta, confere a senha dela), vincula o
 * contato, marca o convite como usado e entra no portal.
 */
export async function acceptPortalInvitationAction(
  _prevState: AcceptPortalInviteState,
  formData: FormData,
): Promise<AcceptPortalInviteState> {
  const token = String(formData.get("token") ?? "")
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const admin = createAdminClient()
  const lookup = await lookupPortalInvitation(admin, token)
  if (!lookup.ok) return { error: lookup.message }
  const { invitation } = lookup
  const password = parsed.data.password

  const supabase = await createClient()
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", invitation.email)
    .maybeSingle()
  let userId = (existing as { id: string } | null)?.id ?? null

  if (userId) {
    if (await isLoginRateLimited(invitation.email)) {
      return { error: "Muitas tentativas. Tente novamente em instantes." }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    })
    if (error) {
      return {
        error:
          "Este e-mail já tem uma conta. Informe a senha atual dela (ou use “Esqueci minha senha” no login do portal).",
      }
    }
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: invitation.contactName },
      })
    if (createError || !created.user) {
      logger.error("portal.invite.create_user_failed", {
        error: createError?.message ?? "sem usuário",
      })
      return { error: "Não foi possível criar o acesso. Tente novamente." }
    }
    userId = created.user.id

    const { error } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    })
    if (error) {
      logger.error("portal.invite.sign_in_failed", { error: error.message })
      return { error: "Acesso criado, mas não foi possível entrar." }
    }
  }

  const { data: linked, error: linkError } = await admin
    .from("contacts")
    .update({ user_id: userId })
    .eq("id", invitation.contact_id)
    .eq("tenant_id", invitation.tenant_id)
    .is("user_id", null)
    .select("id")
    .maybeSingle()
  if (linkError || !linked) {
    logger.error("portal.invite.link_failed", {
      error: linkError?.message ?? "contato já vinculado",
    })
    await supabase.auth.signOut()
    return { error: "Não foi possível liberar o acesso. Peça um novo convite." }
  }

  await admin
    .from("portal_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)

  redirect("/portal")
}
