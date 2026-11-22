"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { dbError } from "@/lib/db-error"
import { isManager } from "@/server/permissions"
import {
  itemGroupSchema,
  importItemRowSchema,
  itemSchema,
} from "@/lib/validations/items"
import { normalizeItemKey } from "@/lib/items/import"

export type ItemFormState = { error?: string; success?: string } | undefined
export type ItemGroupFormState =
  { error?: string; success?: string } | undefined
export type ItemImportState =
  | {
      error?: string
      success?: string
      created?: number
      skipped?: number
      groupsCreated?: number
    }
  | undefined

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

export async function toggleItemActiveAction(
  formData: FormData,
): Promise<void> {
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

function isDuplicateName(error: { message?: string; code?: string }) {
  return error.code === "23505" || /duplicate key/i.test(error.message ?? "")
}

export async function createItemGroupAction(
  _prevState: ItemGroupFormState,
  formData: FormData,
): Promise<ItemGroupFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = itemGroupSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("item_groups").insert({
    tenant_id: active.tenantId,
    name: parsed.data.name,
  })
  if (error) {
    if (isDuplicateName(error)) {
      return { error: "Já existe um grupo com esse nome." }
    }
    return dbError("item_groups.create", error, "Falha ao criar o grupo.")
  }

  revalidateItems()
  return { success: "Grupo criado." }
}

export async function updateItemGroupAction(
  _prevState: ItemGroupFormState,
  formData: FormData,
): Promise<ItemGroupFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Grupo inválido." }

  const parsed = itemGroupSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("item_groups")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  if (error) {
    if (isDuplicateName(error)) {
      return { error: "Já existe um grupo com esse nome." }
    }
    return dbError("item_groups.update", error, "Falha ao atualizar o grupo.")
  }

  revalidateItems()
  return { success: "Grupo atualizado." }
}

export async function deleteItemGroupAction(
  _prevState: ItemGroupFormState,
  formData: FormData,
): Promise<ItemGroupFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!isManager(active.role)) {
    return { error: "Só owner/admin podem excluir grupos." }
  }

  const id = String(formData.get("id") ?? "")
  const mode = String(formData.get("mode") ?? "block")
  const target = String(formData.get("target_group_id") ?? "")
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Grupo inválido." }
  }
  if (target && !z.string().uuid().safeParse(target).success) {
    return { error: "Grupo de destino inválido." }
  }

  const supabase = await createClient()
  // Conta também os itens soft-deleted: a FK do banco os enxerga e barraria o
  // delete do grupo. Sem este ajuste o grupo ficaria impossível de excluir.
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", active.tenantId)
    .eq("group_id", id)

  if ((count ?? 0) > 0) {
    if (mode !== "move") {
      return { error: "Mova os itens antes de excluir o grupo." }
    }

    const { error } = await supabase
      .from("items")
      .update({ group_id: target || null })
      .eq("tenant_id", active.tenantId)
      .eq("group_id", id)
    if (error) {
      return dbError(
        "item_groups.move",
        error,
        "Não foi possível mover os itens do grupo.",
      )
    }
  }

  const { error } = await supabase
    .from("item_groups")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  if (error) {
    return dbError(
      "item_groups.delete",
      error,
      "Não foi possível excluir o grupo.",
    )
  }

  revalidateItems()
  return { success: "Grupo excluído." }
}

export async function importItemsAction(
  _prevState: ItemImportState,
  formData: FormData,
): Promise<ItemImportState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  let payload: unknown
  try {
    payload = JSON.parse(String(formData.get("rows") ?? "[]"))
  } catch {
    return { error: "Não foi possível ler as linhas do arquivo." }
  }
  if (!Array.isArray(payload)) {
    return { error: "Não foi possível ler as linhas do arquivo." }
  }
  if (payload.length > 1000) {
    return { error: "A importação passa de 1000 linhas. Divida o arquivo." }
  }

  const rows: {
    description: string
    long_description: string | null
    group: string | null
    rate: number
    unit: string | null
    tax_name: string | null
    tax_rate: number | null
  }[] = []

  for (const [index, row] of payload.entries()) {
    const parsed = importItemRowSchema.safeParse(row)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "dados inválidos"
      return { error: `Linha ${index + 1}: ${message}` }
    }
    rows.push({
      description: parsed.data.description,
      long_description: parsed.data.long_description ?? null,
      group: parsed.data.group ?? null,
      rate: parsed.data.rate,
      unit: parsed.data.unit ?? null,
      tax_name: parsed.data.tax_name ?? null,
      tax_rate: parsed.data.tax_rate ?? null,
    })
  }

  const supabase = await createClient()
  const [itemsResult, groupsResult] = await Promise.all([
    supabase
      .from("items")
      .select("description")
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null),
    supabase
      .from("item_groups")
      .select("id, name")
      .eq("tenant_id", active.tenantId),
  ])

  const existing = new Set(
    ((itemsResult.data ?? []) as { description: string }[]).map((row) =>
      normalizeItemKey(row.description),
    ),
  )
  const groupByName = new Map(
    ((groupsResult.data ?? []) as { id: string; name: string }[]).map((row) => [
      normalizeItemKey(row.name),
      row.id,
    ]),
  )

  const selected: typeof rows = []
  for (const row of rows) {
    const key = normalizeItemKey(row.description)
    if (existing.has(key)) continue
    existing.add(key)
    selected.push(row)
  }
  const skipped = rows.length - selected.length

  if (selected.length === 0) {
    return { error: "Nenhuma linha válida para importar." }
  }

  const missingGroups = new Map<string, string>()
  for (const row of selected) {
    if (!row.group) continue
    const key = normalizeItemKey(row.group)
    if (!groupByName.has(key) && !missingGroups.has(key)) {
      missingGroups.set(key, row.group)
    }
  }

  const createdGroupIds: string[] = []
  if (missingGroups.size > 0) {
    const { data, error } = await supabase
      .from("item_groups")
      .insert(
        [...missingGroups.values()].map((name) => ({
          tenant_id: active.tenantId,
          name,
        })),
      )
      .select("id, name")
    if (error) {
      return dbError("item_groups.import", error, "Falha ao criar os grupos.")
    }
    for (const group of (data ?? []) as { id: string; name: string }[]) {
      groupByName.set(normalizeItemKey(group.name), group.id)
      createdGroupIds.push(group.id)
    }
  }

  const user = await getUser()
  const { error } = await supabase.from("items").insert(
    selected.map((row) => ({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      group_id: row.group
        ? (groupByName.get(normalizeItemKey(row.group)) ?? null)
        : null,
      description: row.description,
      long_description: row.long_description,
      rate: row.rate,
      purchase_price: null,
      unit: row.unit,
      tax_name: row.tax_name,
      tax_rate: row.tax_rate,
      active: true,
    })),
  )

  if (error) {
    if (createdGroupIds.length > 0) {
      await supabase.from("item_groups").delete().in("id", createdGroupIds)
    }
    return dbError("items.import", error, "Falha ao importar os itens.")
  }

  revalidateItems()
  return {
    success: `${selected.length} item(ns) importado(s), ${skipped} ignorado(s).`,
    created: selected.length,
    skipped,
    groupsCreated: createdGroupIds.length,
  }
}
