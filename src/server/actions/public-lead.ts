"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { publicLeadSchema } from "@/lib/validations/public-lead"

export type PublicLeadState = { error?: string; success?: string } | undefined

export async function submitPublicLeadAction(
  _prevState: PublicLeadState,
  formData: FormData,
): Promise<PublicLeadState> {
  const slug = String(formData.get("slug") ?? "").trim()
  if (!slug) return { error: "Formulário inválido." }

  // Honeypot: se preenchido, é bot — finge sucesso.
  const honeypot = String(formData.get("company_website") ?? "")
  if (honeypot.length > 0) {
    return { success: "Recebemos sua mensagem. Obrigado!" }
  }

  const parsed = publicLeadSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    message: String(formData.get("message") ?? "").trim() || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, web_to_lead_enabled, web_to_lead_source_id")
    .eq("slug", slug)
    .maybeSingle()

  if (!tenant || !tenant.web_to_lead_enabled) {
    return { error: "Formulário indisponível." }
  }

  const { error } = await admin.from("leads").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    description: parsed.data.message || null,
    source_id: tenant.web_to_lead_source_id ?? null,
  })

  if (error) return { error: error.message }

  return { success: "Recebemos sua mensagem. Em breve entraremos em contato!" }
}
