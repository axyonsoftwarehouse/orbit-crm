"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { dbError } from "@/lib/db-error"
import { isManager } from "@/server/permissions"
import { itemSchema } from "@/lib/validations/items"

export type ItemFormState = { error?: string; success?: string } | undefined

const PATHS = ["/app/itens", "/app/itens/grupos"]

function invalid(formData: FormData) {
  return itemSchema.safeParse({
    description: formData.get("description"),
    long_description: formData.get("long_description") || undefined,
    group_id: formData.get("group_id") || undefined,
    rate: formData.get("rate"),
    purchase_price: formData.get("purchase_price") || undefined,
    unit: formData.get("unit") || undefined,
    tax_name: formData.get("tax_name") || undefined,
    tax_rate: formData.get("tax_rate") || undefined,
    active: formData.get("active") === "on",
  })
}

function itemValues(data: ReturnType<typeof invalid>) {
  if (!data.success) return null
  const value = data.data
  return {
    description: value.description,
    long_description: value.long_description ?? null,
    group_id: value.group_id ?? null,
    rate: value.rate,
    purchase_price: value.purchase_price ?? null,
    unit: value.unit ?? null,
    tax_name: value.tax_name ?? null,
    tax_rate: value.tax_rate ?? null,
    active: value.active,
  }
}

function revalidateItems() {
  for (const path of PATHS) revalidatePath(path)
}

export async function createItemAction(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = invalid(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  const values = itemValues(parsed)
  if (!values) return { error: "Dados inválidos." }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("items").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    ...values,
  })
  if (error) return dbError("items.create", error, "Falha ao criar o item.")

  revalidateItems()
  return { success: "Item criado." }
}

export async function updateItemAction(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Item inválido." }

  const parsed = invalid(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  const values = itemValues(parsed)
  if (!values) return { error: "Dados inválidos." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("items")
    .update(values)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  if (error) return dbError("items.update", error, "Falha ao atualizar o item.")

  revalidateItems()
  return { success: "Item atualizado." }
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const active = await getActiveMembership()
  if (!active) return
  if (!isManager(active.role)) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidateItems()
}

const COPY_SUFFIX = " (cópia)"

export async function duplicateItemAction(formData: FormData): Promise<void> {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  if (!data) return

  const prefix = String(data.description).slice(0, 200 - COPY_SUFFIX.length)
  const user = await getUser()

  await supabase.from("items").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    group_id: data.group_id,
    description: `${prefix}${COPY_SUFFIX}`,
    long_description: data.long_description,
    rate: data.rate,
    purchase_price: data.purchase_price,
    unit: data.unit,
    tax_name: data.tax_name,
    tax_rate: data.tax_rate,
    active: true,
  })

  revalidateItems()
}

export async function toggleItemActiveAction(formData: FormData): Promise<void> {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  const { data } = await supabase
    .from("items")
    .select("active")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  if (!data) return

  await supabase
    .from("items")
    .update({ active: !data.active })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidateItems()
}
