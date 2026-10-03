"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TENANT_COOKIE } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { tenantSettingsSchema } from "@/lib/validations/tenant"

export async function setActiveTenantAction(tenantId: string) {
  const memberships = await getMemberships()
  const allowed = memberships.some(
    (membership) => membership.tenant.id === tenantId,
  )

  if (!allowed) {
    throw new Error("Você não tem acesso a esta empresa.")
  }

  const store = await cookies()
  store.set(TENANT_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect("/app")
}

export type TenantSettingsState =
  { error?: string; success?: string } | undefined

export async function updateWebToLeadAction(
  _prevState: TenantSettingsState,
  formData: FormData,
): Promise<TenantSettingsState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!["owner", "admin"].includes(active.role)) {
    return { error: "Você não tem permissão para editar a empresa." }
  }

  const enabled = formData.get("web_to_lead_enabled") === "on"
  const sourceId = String(formData.get("web_to_lead_source_id") ?? "") || null

  const supabase = await createClient()
  const { error } = await supabase
    .from("tenants")
    .update({
      web_to_lead_enabled: enabled,
      web_to_lead_source_id: sourceId,
    })
    .eq("id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app/configuracoes")
  return { success: "Configuração salva." }
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024

export async function updateTenantSettingsAction(
  _prevState: TenantSettingsState,
  formData: FormData,
): Promise<TenantSettingsState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!["owner", "admin"].includes(active.role)) {
    return { error: "Você não tem permissão para editar a empresa." }
  }

  const parsed = tenantSettingsSchema.safeParse({
    name: formData.get("name"),
    primary_color: formData.get("primary_color") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  let logoUrl: string | undefined

  const logo = formData.get("logo")
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return { error: "O logo deve ter no máximo 2 MB." }
    }
    if (!logo.type.startsWith("image/")) {
      return { error: "Envie um arquivo de imagem." }
    }

    const ext =
      (logo.name.split(".").pop() ?? "png")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "png"
    const path = `${active.tenantId}/logo-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(path, logo, { upsert: true, contentType: logo.type })

    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from("branding").getPublicUrl(path)
    logoUrl = data.publicUrl
  }

  const { error } = await supabase
    .from("tenants")
    .update({
      name: parsed.data.name,
      primary_color: parsed.data.primary_color,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app", "layout")
  return { success: "Empresa atualizada." }
}
