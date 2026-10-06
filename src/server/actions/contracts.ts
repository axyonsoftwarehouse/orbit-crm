"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { contractSchema } from "@/lib/validations/contracts"

export type ContractFormState = { error?: string; success?: string } | undefined

function parseContract(formData: FormData) {
  return contractSchema.safeParse({
    title: formData.get("title"),
    company_id: formData.get("company_id") || undefined,
    description: formData.get("description") || undefined,
    value: formData.get("value"),
    start_date: formData.get("start_date") || undefined,
    end_date: formData.get("end_date") || undefined,
    status: formData.get("status") ?? 1,
    note: formData.get("note") || undefined,
  })
}

export async function createContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseContract(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("contracts").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    ...parsed.data,
    value: parsed.data.value ?? null,
  })

  if (error) return dbError("contracts", error)

  revalidatePath("/app/contratos")
  return { success: "Contrato criado." }
}

export async function updateContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Contrato inválido." }

  const parsed = parseContract(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contracts")
    .update({ ...parsed.data, value: parsed.data.value ?? null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("contracts", error)

  revalidatePath("/app/contratos")
  return { success: "Contrato atualizado." }
}

export async function deleteContractAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("contracts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/contratos")
}
