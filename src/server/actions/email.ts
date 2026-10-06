"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { EMAIL_TEMPLATES } from "@/lib/email-templates"

export type EmailTemplateState =
  { error?: string; success?: string } | undefined

export async function saveEmailTemplateAction(
  _prevState: EmailTemplateState,
  formData: FormData,
): Promise<EmailTemplateState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!["owner", "admin"].includes(active.role)) {
    return { error: "Você não tem permissão para editar modelos." }
  }

  const key = String(formData.get("key") ?? "")
  if (!key || !EMAIL_TEMPLATES[key]) return { error: "Modelo inválido." }

  const subject = String(formData.get("subject") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  if (!subject) return { error: "Informe o assunto." }
  if (!body) return { error: "Informe o corpo do e-mail." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("email_templates")
    .upsert(
      { tenant_id: active.tenantId, key, subject, body },
      { onConflict: "tenant_id,key" },
    )

  if (error) return dbError("email", error)

  revalidatePath("/app/configuracoes")
  return { success: "Modelo salvo." }
}

export async function resetEmailTemplateAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  if (!["owner", "admin"].includes(active.role)) return

  const key = String(formData.get("key") ?? "")
  if (!key) return

  const supabase = await createClient()
  await supabase
    .from("email_templates")
    .delete()
    .eq("tenant_id", active.tenantId)
    .eq("key", key)

  revalidatePath("/app/configuracoes")
}
