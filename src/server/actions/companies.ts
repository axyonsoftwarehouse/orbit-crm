"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { companySchema } from "@/lib/validations/clients"
import { saveCustomFieldValues } from "@/server/custom-fields"
import { checkPlanLimit } from "@/server/plan-limits"
import { dbError } from "@/lib/db-error"

export type CompanyFormState = { error?: string; success?: string } | undefined

function parseCompany(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name"),
    vat: formData.get("vat") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zip: formData.get("zip") || undefined,
    country: formData.get("country") || undefined,
    notes: formData.get("notes") || undefined,
  })
}

export async function createCompanyAction(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "clients")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const parsed = parseCompany(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id,
      ...parsed.data,
    })
    .select("id")
    .single()

  if (error) return dbError("companies", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "company",
    data.id,
    formData,
  )

  revalidatePath("/app/clientes")
  return { success: "Cliente criado." }
}

export async function updateCompanyAction(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Cliente inválido." }

  const parsed = parseCompany(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("companies", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "company",
    id,
    formData,
  )

  revalidatePath("/app/clientes")
  revalidatePath(`/app/clientes/${id}`)
  return { success: "Cliente atualizado." }
}

export async function deleteCompanyAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/clientes")
  redirect("/app/clientes")
}
