"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { contactSchema } from "@/lib/validations/clients"

export type ContactFormState = { error?: string; success?: string } | undefined

function parseContact(formData: FormData) {
  return contactSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    title: formData.get("title") || undefined,
    is_primary: formData.get("is_primary") === "on",
  })
}

export async function createContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const companyId = String(formData.get("company_id") ?? "")
  if (!companyId) return { error: "Cliente inválido." }

  const parsed = parseContact(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("contacts").insert({
    tenant_id: active.tenantId,
    company_id: companyId,
    created_by: user?.id,
    ...parsed.data,
  })

  if (error) return { error: error.message }

  revalidatePath(`/app/clientes/${companyId}`)
  return { success: "Contato adicionado." }
}

export async function updateContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")
  if (!id || !companyId) return { error: "Contato inválido." }

  const parsed = parseContact(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contacts")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath(`/app/clientes/${companyId}`)
  return { success: "Contato atualizado." }
}

export async function deleteContactAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")

  const supabase = await createClient()
  await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (companyId) revalidatePath(`/app/clientes/${companyId}`)
}

export type InviteContactState =
  { error?: string; success?: string } | undefined

export async function inviteContactToPortalAction(
  _prevState: InviteContactState,
  formData: FormData,
): Promise<InviteContactState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!["owner", "admin"].includes(active.role)) {
    return { error: "Você não tem permissão para liberar acesso ao portal." }
  }

  const contactId = String(formData.get("contact_id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!contactId || password.length < 8) {
    return { error: "Defina uma senha com pelo menos 8 caracteres." }
  }

  const supabase = await createClient()
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name, user_id")
    .eq("id", contactId)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()

  if (!contact) return { error: "Contato não encontrado." }
  if (!contact.email) {
    return { error: "Cadastre um e-mail para o contato antes de dar acesso." }
  }
  if (contact.user_id) {
    return { error: "Este contato já possui acesso ao portal." }
  }

  const admin = createAdminClient()

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: contact.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
      },
    })

  if (createError || !created.user) {
    return {
      error:
        "Não foi possível criar o acesso. Este e-mail pode já possuir uma conta.",
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update({ user_id: created.user.id })
    .eq("id", contactId)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  if (companyId) revalidatePath(`/app/clientes/${companyId}`)
  revalidatePath("/app/clientes")
  return { success: `Acesso ao portal criado para ${contact.email}.` }
}
